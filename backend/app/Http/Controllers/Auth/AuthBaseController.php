<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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

        return Socialite::driver($this->supportedProviders[$provider]);
    }

    /**
     * Redirect to OAuth provider
     */
    public function redirectAdmin(?string $provider = null)
    {
        session(['login_type' => 'admin']);

        $provider = $provider ?: 'google';

        try {
            return $this->getDriver($provider)->stateless()->redirect();
        } catch (\Exception $e) {
            \Log::error("OAuth Redirect Error [{$provider}]: ".$e->getMessage());
            return redirect(env('ADMIN_FRONTEND_URL', 'http://localhost:5173').'/login')->with('error', 'Authentication service unavailable');
        }
    }

    public function redirectUser(?string $provider = null)
    {
        session(['login_type' => 'user']);

        $provider = $provider ?: 'google';

        try {
            return $this->getDriver($provider)->redirect();
        } catch (\Exception $e) {
            \Log::error("OAuth Redirect Error [{$provider}]: ".$e->getMessage());
            return redirect(env('ADMIN_FRONTEND_URL', 'http://localhost:5173').'/login')->with('error', 'Authentication service unavailable');
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

            // Find or create user
            $user = $this->findOrCreateUser($oauthUser, $provider);

            // Create Sanctum token
            $token = $user->createToken('access_token')->plainTextToken;

            // Redirect to frontend with token and user data
            $frontendUrl = env('ADMIN_FRONTEND_URL', 'http://localhost:5173');
            $userData = [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'provider' => $user->provider,
                'email_verified_at' => $user->email_verified_at,
            ];

            // Encode user data for URL
            $userJson = base64_encode(json_encode($userData));
            return redirect("{$frontendUrl}/login-success?token={$token}&user={$userJson}");

        } catch (\Exception $e) {
            \Log::error("OAuth Callback Error [{$provider}]: ".$e->getMessage());
            $frontendUrl = env('ADMIN_FRONTEND_URL', 'http://localhost:5173');
            return redirect("{$frontendUrl}/login")->with('error', 'Authentication failed. Please try again.');
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
            return User::create([
                'full_name' => $oauthUser->getName(),
                'email' => $oauthUser->getEmail(),
                'email_verified_at' => now(),
                'password' => bcrypt(Str::random(16)), // Random password
                'provider' => $provider,
                'provider_id' => $oauthUser->getId(),
                'avatar' => $oauthUser->getAvatar(),
            ]);
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
                    'created_at' => $user->created_at,
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
