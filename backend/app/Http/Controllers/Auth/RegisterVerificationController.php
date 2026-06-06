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

class RegisterVerificationController extends AuthBaseController
{
    /**
     * Step 1 — Validate registration data, store it, and send OTP to email.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9_.]+$/', 'unique:users,username'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'full_name.required' => 'Vui lòng nhập họ và tên.',
            'username.required'  => 'Vui lòng nhập username.',
            'username.max'       => 'Username không được vượt quá 30 ký tự.',
            'username.regex'     => 'Username chỉ được chứa chữ cái, số, dấu chấm và dấu gạch dưới.',
            'username.unique'    => 'Username đã tồn tại.',
            'email.required'     => 'Vui lòng nhập email.',
            'email.email'        => 'Email không hợp lệ.',
            'email.unique'       => 'Email đã tồn tại.',
            'password.required'  => 'Vui lòng nhập mật khẩu.',
            'password.min'       => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        $email = strtolower($validated['email']);
        $isSchoolStudent = (bool) preg_match('/^\d{10}@caothang\.edu\.vn$/', $email);

        // Invalidate any existing pending OTP for this email
        RegistrationOtp::where('email', $email)->whereNull('used_at')->delete();

        $plainOtp = (string) random_int(100000, 999999);

        RegistrationOtp::create([
            'email'             => $email,
            'otp'               => Hash::make($plainOtp),
            'registration_data' => [
                'full_name'         => $validated['full_name'],
                'username'          => $validated['username'],
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

        if (User::where('username', $data['username'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Username đã được sử dụng. Vui lòng đăng ký lại với username khác.',
            ], HttpStatus::UNPROCESSABLE_ENTITY->value);
        }

        $user = User::create([
            'full_name'         => $data['full_name'],
            'username'          => $data['username'],
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
