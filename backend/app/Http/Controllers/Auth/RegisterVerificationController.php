<?php

namespace App\Http\Controllers\Auth;

use App\Enums\HttpStatus;
use App\Mail\OtpMail;
use App\Models\RegistrationOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class RegisterVerificationController extends AuthBaseController
{
    #[OA\Post(
        path: '/v1/auth/register',
        summary: 'Bước 1 — Xác thực dữ liệu đăng ký, lưu tạm và gửi OTP tới email (giới hạn 5 lần/phút/IP)',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['full_name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'full_name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Đã gửi OTP tới email', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate (email đã tồn tại...)', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Step 1 — Validate registration data, store it, and send OTP to email.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'full_name.required' => 'Vui lòng nhập họ và tên.',
            'email.required'     => 'Vui lòng nhập email.',
            'email.email'        => 'Email không hợp lệ.',
            'email.unique'       => 'Email đã tồn tại.',
            'password.required'  => 'Vui lòng nhập mật khẩu.',
            'password.min'       => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        $email = strtolower($validated['email']);
        $isSchoolStudent = (bool) preg_match('/^\d{10}@caothang\.edu\.vn$/', $email);
        $username = User::generateUniqueUsername($email);

        // Invalidate any existing pending OTP for this email
        RegistrationOtp::where('email', $email)->whereNull('used_at')->delete();

        $plainOtp = (string) random_int(100000, 999999);

        RegistrationOtp::create([
            'email'             => $email,
            'otp'               => Hash::make($plainOtp),
            'registration_data' => [
                'full_name'         => $validated['full_name'],
                'username'          => $username,
                'password'          => Hash::make($validated['password']),
                'student_code'      => $isSchoolStudent ? Str::before($email, '@') : null,
            ],
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($email)->send(new OtpMail($plainOtp, $validated['full_name'], 'registration'));

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP đã được gửi đến email của bạn.',
        ], HttpStatus::OK->value);
    }

    #[OA\Post(
        path: '/v1/auth/register/verify-otp',
        summary: 'Bước 2 — Xác nhận OTP, tạo tài khoản và trả về token (giới hạn 5 lần/phút/IP)',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['email', 'otp'], properties: [
                new OA\Property(property: 'email', type: 'string', format: 'email'),
                new OA\Property(property: 'otp', type: 'string', minLength: 6, maxLength: 6),
            ])
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Đăng ký thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string'),
                    new OA\Property(property: 'token', type: 'string'),
                    new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                ])
            ),
            new OA\Response(response: 422, description: 'OTP không hợp lệ/hết hạn hoặc email đã được sử dụng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Step 2 — Verify OTP, create the user account, and return a token.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp'   => ['required', 'string', 'size:6'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'otp.required'   => 'Vui lòng nhập mã OTP.',
            'otp.size'       => 'Mã OTP phải có đúng 6 ký tự.',
        ]);

        $email = strtolower($request->email);

        $record = RegistrationOtp::where('email', $email)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $record || $record->isExpired() || ! Hash::check($request->otp, $record->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.',
            ], HttpStatus::UNPROCESSABLE_ENTITY->value);
        }

        $data = $record->registration_data;

        // Guard against race conditions
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Email đã được sử dụng.',
            ], HttpStatus::UNPROCESSABLE_ENTITY->value);
        }

        $username = User::where('username', $data['username'])->exists()
            ? User::generateUniqueUsername($email)
            : $data['username'];

        $user = User::create([
            'full_name'         => $data['full_name'],
            'username'          => $username,
            'email'             => $email,
            'student_code'      => $data['student_code'],
            'password'          => $data['password'], // already hashed
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        $record->update(['used_at' => now()]);

        $token = $this->createToken($user, 'user');

        $user->load('roles:id,name,label');

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công.',
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
        ], HttpStatus::CREATED->value);
    }
}
