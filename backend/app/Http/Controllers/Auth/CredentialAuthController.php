<?php

namespace App\Http\Controllers\Auth;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Enums\PermissionsEnum;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CredentialAuthController extends AuthBaseController
{
    /**
     * Login for regular users — returns a 24-hour token.
     */
    public function loginUser(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => ['required', 'string'],
            'password'   => ['required', 'string'],
        ]);

        return $this->attemptLogin($request->identifier, $request->password, 'user');
    }

    /**
     * Login for admin users — returns an 8-hour token.
     * Requires the admin_panel.access permission.
     */
    public function loginAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => ['required', 'string'],
            'password'   => ['required', 'string'],
        ]);

        return $this->attemptLogin($request->identifier, $request->password, 'admin');
    }

    private function attemptLogin(string $identifier, string $password, string $loginType): JsonResponse
    {
        $user = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin đăng nhập không chính xác.',
            ], HttpStatus::UNAUTHORIZED->value);
        }

        if ($user->is_active === false) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.',
            ], HttpStatus::FORBIDDEN->value);
        }

        if ($loginType === 'admin' && ! $user->hasPermissionTo(PermissionsEnum::ADMIN_PANEL_ACCESS->value)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập vào trang quản trị.',
            ], HttpStatus::FORBIDDEN->value);
        }

        $user->tokens()->delete();

        $token = $this->createToken($user, $loginType);

        $user->load('roles:id,name,label');

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
                'username'  => $user->username,
                'avatar'    => $user->avatar,
                'provider'  => $user->provider,
                'roles'     => $user->roles->map(fn ($r) => [
                    'name'  => $r->name,
                    'label' => $r->label,
                ])->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ],
        ], HttpStatus::OK->value);
    }
}
