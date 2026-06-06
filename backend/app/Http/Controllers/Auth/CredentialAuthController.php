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
     * Register a regular user account and return a 24-hour token.
     */
    public function registerUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9_.]+$/', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'full_name.required' => 'Vui lòng nhập họ và tên.',
            'username.required' => 'Vui lòng nhập username.',
            'username.max' => 'Username không được vượt quá 30 ký tự.',
            'username.regex' => 'Username chỉ được chứa chữ cái, số, dấu chấm và dấu gạch dưới.',
            'username.unique' => 'Username đã tồn tại.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        $email = $validated['email'];
        $isSchoolStudent = (bool) preg_match('/^\d{10}@caothang\.edu\.vn$/', $email);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'username' => $validated['username'],
            'email' => $email,
            'student_code' => $isSchoolStudent ? \Illuminate\Support\Str::before($email, '@') : null,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $token = $this->createToken($user, 'user');

        $user->load('roles:id,name,label');

        return response()->json([
            'success' => true,
            'message' => ApiMessage::REGISTER_SUCCESS->value,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'provider' => $user->provider,
                'roles' => $user->roles->map(fn ($r) => [
                    'name' => $r->name,
                    'label' => $r->label,
                ])->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ],
        ], HttpStatus::CREATED->value);
    }

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
