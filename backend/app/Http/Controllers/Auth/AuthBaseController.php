<?php

namespace App\Http\Controllers\Auth;

use App\Enums\RolesEnum;
use App\Http\Controllers\Controller;
use GuzzleHttp\Client;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Enums\ApiMessage;
use App\Enums\HttpStatus;

abstract class AuthBaseController extends Controller
{
    /**
     * Supported OAuth providers
     */
    protected array $supportedProviders = [
        'google' => 'google',
        // 'github' => 'github',
        // 'facebook' => 'facebook',
        // 'twitter' => 'twitter',
    ];

    /**
     * Get the OAuth driver for the given provider
     */
    protected function getDriver(string $provider)
    {
        if (! isset($this->supportedProviders[$provider])) {
            throw new \InvalidArgumentException("Provider {$provider} is not supported");
        }

        $driver = Socialite::driver($this->supportedProviders[$provider]);

        // Local Windows setups often miss a CA bundle; allow opting out for dev only.
        $shouldVerifySsl = filter_var(env('OAUTH_HTTP_VERIFY', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
        if (! $shouldVerifySsl) {
            $driver->setHttpClient(new Client([
                'verify' => false,
            ]));
        }

        return $driver;
    }

    /**
     * Redirect to OAuth provider
     */
    public function redirectAdmin(?string $provider = null)
    {
        session(['login_type' => 'admin']);

        $provider = $provider ?: 'google';

        try {
            // Dynamic redirect URI based on current request
            $redirectUri = url('/auth/google/callback');
            \Log::info("OAuth Redirect URI: ".$redirectUri);
            \Log::info("Full URL: ".request()->fullUrl());
            return $this->getDriver($provider)
                ->redirectUrl($redirectUri)
                ->with(['prompt' => 'select_account'])
                ->redirect();
        } catch (\Exception $e) {
            \Log::error("OAuth Redirect Error [{$provider}]: ".$e->getMessage());
            // Debug: Return error message instead of redirect
            return response()->json([
                'error' => 'OAuth Redirect Error',
                'message' => $e->getMessage(),
                'provider' => $provider,
                'redirect_uri' => url('/auth/google/callback')
            ], 500);
        }
    }

    public function redirectUser(?string $provider = null)
    {
        session(['login_type' => 'user']);

        $provider = $provider ?: 'google';

        try {
            $redirectUri = url('/auth/google/callback');
            \Log::info("OAuth Redirect URI: ".$redirectUri);
            \Log::info("Full URL: ".request()->fullUrl());

            return $this->getDriver($provider)
                ->redirectUrl($redirectUri)
                ->with(['prompt' => 'select_account'])
                ->redirect();
        } catch (\Exception $e) {
            \Log::error("OAuth Redirect Error [{$provider}]: ".$e->getMessage());
            return redirect(env('USER_FRONTEND_URL', 'http://localhost:5173'))->with('error', 'Authentication service unavailable');
        }
    }

    /**
     * Handle OAuth callback
     */
    public function callback(?string $provider = null, ?Request $request = null)
    {
        $provider = $provider ?: 'google';
        $request = $request ?: request();

        try {
            $oauthUser = $this->getDriver($provider)->stateless()->user();

            $loginType = session('login_type');

            if (! $loginType) {
                return response()->json([
                    'message' => 'Login type is required',
                ], 400);
            }

            if ($loginType === 'admin') {
                return $this->handleAdmin($oauthUser, $provider);
            }

            return $this->handleUser($oauthUser, $provider);

        } catch (\Exception $e) {
            \Log::error("OAuth Callback Error [{$provider}]: ".$e->getMessage());
            $loginType = session('login_type');
            $frontendUrl = rtrim($loginType === 'admin'
                ? env('ADMIN_FRONTEND_URL', 'http://localhost:5173')
                : env('USER_FRONTEND_URL', 'http://localhost:5173'), '/');

            $payload = json_encode([
                'type' => 'OAUTH_AUTH_ERROR',
                'message' => 'Authentication failed. Please try again.',
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            return response(
                sprintf(
                    <<<'HTML'
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <title>Login Error</title>
                    </head>
                    <body>
                        <script>
                            (function () {
                                var payload = %s;
                                var targetOrigin = "%s";

                                if (window.opener) {
                                    window.opener.postMessage(payload, targetOrigin);
                                    window.close();
                                    return;
                                }

                                window.location.href = targetOrigin + '/login?error=' + encodeURIComponent(payload.message);
                            })();
                        </script>
                    </body>
                    </html>
                    HTML,
                    $payload,
                    $frontendUrl
                ),
                200,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }
    }

    /**
     * Find or create user from OAuth data
     */
    protected function findOrCreateUser($oauthUser, string $provider): User
    {
        // Find existing user by email
        $user = User::where('email', $oauthUser->getEmail())->first();

        if (! $user) {
            // Create new user
            $user = User::create([
                'full_name' => $oauthUser->getName(),
                'email' => $oauthUser->getEmail(),
                'email_verified_at' => now(),
                'password' => bcrypt(Str::random(16)), // Random password
                'provider' => $provider,
                'provider_id' => $oauthUser->getId(),
                'avatar' => $oauthUser->getAvatar(),
            ]);

            $user->assignRole(RolesEnum::USER->value);
        }

        // Update existing user's OAuth info
        $user->update([
            'full_name' => $oauthUser->getName(),
            'avatar' => $oauthUser->getAvatar(),
            'provider' => $provider,
            'provider_id' => $oauthUser->getId(),
        ]);

        return $user;
    }

    protected function handleAdmin($oauthUser, $provider)
    {
        $user = User::where('email', $oauthUser->getEmail())->first();

        try {
            $ADMIN_ROLES = [
                RolesEnum::ADMIN,
                RolesEnum::PRESIDENT,
                RolesEnum::VICE_PRESIDENT,
                RolesEnum::ACADEMIC_HEAD,
                RolesEnum::COMMUNICATIONS_HEAD,
                RolesEnum::VOLUNTEER_HEAD,
            ];

            if (! $user || ! $user->hasAnyRole($ADMIN_ROLES)) {
                $frontendUrl = rtrim(env('ADMIN_FRONTEND_URL', 'http://localhost:5173'), '/');
                $payload = json_encode([
                    'type' => 'OAUTH_AUTH_ERROR',
                    'message' => 'Bạn không có quyền truy cập vào trang quản trị!',
                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

                return response(
                    sprintf(
                        <<<'HTML'
                        <!doctype html>
                        <html lang="en">
                        <head>
                            <meta charset="utf-8">
                            <title>Login Error</title>
                        </head>
                        <body>
                            <script>
                                (function () {
                                    var payload = %s;
                                    var targetOrigin = "%s";

                                    if (window.opener) {
                                        window.opener.postMessage(payload, targetOrigin);
                                        window.close();
                                        return;
                                    }

                                    window.location.href = targetOrigin + '/login?error=' + encodeURIComponent(payload.message);
                                })();
                            </script>
                        </body>
                        </html>
                        HTML,
                        $payload,
                        $frontendUrl
                    ),
                    200,
                    ['Content-Type' => 'text/html; charset=UTF-8']
                );
            }

            // Update existing user's OAuth info
            $user->update([
                'full_name' => $oauthUser->getName(),
                'avatar' => $oauthUser->getAvatar(),
                'provider' => $provider,
                'provider_id' => $oauthUser->getId(),
            ]);

            $user->tokens()->delete();

            // Create Sanctum token
            $token = $this->createToken($user);

            $frontendUrl = env('ADMIN_FRONTEND_URL', 'http://localhost:5173');

            $targetOrigin = rtrim($frontendUrl, '/');
            $payload = json_encode([
                'type' => 'OAUTH_AUTH_SUCCESS',
                'token' => $token,
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            return response(
                <<<HTML
                        <!doctype html>
                        <html lang="en">
                        <head>
                            <meta charset="utf-8">
                            <title>Google Login Success</title>
                        </head>
                        <body>
                            <script>
                                (function () {
                                    var payload = {$payload};
                                    var targetOrigin = "{$targetOrigin}";

                                    if (window.opener) {
                                        window.opener.postMessage(payload, targetOrigin);
                                        window.close();
                                        return;
                                    }

                                    window.location.href = targetOrigin;
                                })();
                            </script>
                        </body>
                        </html>
                        HTML,
                200,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        } catch (\Exception $e) {
            \Log::error("Admin OAuth Handling Error: ".$e->getMessage());

            $frontendUrl = rtrim(env('ADMIN_FRONTEND_URL', 'http://localhost:5173'), '/');
            $payload = json_encode([
                'type' => 'OAUTH_AUTH_ERROR',
                'message' => 'Đã xảy ra lỗi trong quá trình xử lý đăng nhập. Vui lòng thử lại.',
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            return response(
                sprintf(
                    <<<'HTML'
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <title>Login Error</title>
                    </head>
                    <body>
                        <script>
                            (function () {
                                var payload = %s;
                                var targetOrigin = "%s";

                                if (window.opener) {
                                    window.opener.postMessage(payload, targetOrigin);
                                    window.close();
                                    return;
                                }

                                window.location.href = targetOrigin + '/login?error=' + encodeURIComponent(payload.message);
                            })();
                        </script>
                    </body>
                    </html>
                    HTML,
                    $payload,
                    $frontendUrl
                ),
                200,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }
    }

    protected function handleUser($oauthUser, $provider)
    {
        // Find or create user
        $user = $this->findOrCreateUser($oauthUser, $provider);

        $user->tokens()->delete();

        // Create Sanctum token
        $token = $this->createToken($user);

        $frontendUrl = env('USER_FRONTEND_URL', 'http://localhost:5173');

        $targetOrigin = rtrim($frontendUrl, '/');
        $payload = json_encode([
            'type' => 'OAUTH_AUTH_SUCCESS',
            'token' => $token,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return response(
            <<<HTML
                        <!doctype html>
                        <html lang="en">
                        <head>
                            <meta charset="utf-8">
                            <title>Google Login Success</title>
                        </head>
                        <body>
                            <script>
                                (function () {
                                    var payload = {$payload};
                                    var targetOrigin = "{$targetOrigin}";

                                    if (window.opener) {
                                        window.opener.postMessage(payload, targetOrigin);
                                        window.close();
                                        return;
                                    }

                                    window.location.href = targetOrigin;
                                })();
                            </script>
                        </body>
                        </html>
                        HTML,
            200,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }

    private function createToken($user)
    {
        $token = $user->createToken('access_token');

        $loginType = session('login_type');

        $token->accessToken->forceFill([
            'expires_at' => $loginType === 'admin' ? now()->addHours(8) : now()->addHours(24),
        ])->save();

        return $token->plainTextToken;
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Get current user
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user found',
                ], HttpStatus::UNAUTHORIZED->value);
            }

            // Revoke current token
            $user->currentAccessToken()->delete();

            // Optionally revoke all tokens
            // $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => ApiMessage::LOGOUT_SUCCESS->value,
            ], HttpStatus::OK->value);

        } catch (\Exception $e) {
            \Log::error('Logout Error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Logout failed. Please try again.',
            ], HttpStatus::INTERNAL_SERVER_ERROR->value);
        }
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user found',
                ], HttpStatus::UNAUTHORIZED->value);
            }

            // Revoke all tokens
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out from all devices successfully',
            ], HttpStatus::OK->value);

        } catch (\Exception $e) {
            \Log::error('Logout All Error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Logout failed. Please try again.',
            ], HttpStatus::INTERNAL_SERVER_ERROR->value);
        }
    }

    /**
     * Get authenticated user info
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => ApiMessage::UNAUTHORIZED->value,
                ], HttpStatus::UNAUTHORIZED->value);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'provider' => $user->provider,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at?->format('d/m/Y'),
                ]
            ], HttpStatus::OK->value);

        } catch (\Exception $e) {
            \Log::error('Get User Info Error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to get user information',
            ], HttpStatus::INTERNAL_SERVER_ERROR->value);
        }
    }
}
