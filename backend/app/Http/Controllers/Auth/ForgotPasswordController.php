<?php

namespace App\Http\Controllers\Auth;

use App\Enums\HttpStatus;
use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class ForgotPasswordController extends Controller
{
    #[OA\Post(
        path: '/v1/auth/forgot-password',
        summary: 'Bước 1 — Gửi mã OTP 6 số tới email để đặt lại mật khẩu (giới hạn 5 lần/phút/IP)',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['email'], properties: [
                new OA\Property(property: 'email', type: 'string', format: 'email'),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Đã gửi OTP (luôn trả về thành công kể cả khi email không tồn tại, để tránh dò email)', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Step 1 — Send a 6-digit OTP to the given email.
     * Throttled to 3 requests per hour per email via route middleware.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
        ]);

        $email = strtolower($request->email);

        // Always return the same message to avoid user enumeration
        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json([
                'success' => true,
                'message' => 'Mã OTP đã được gửi đi.',
            ], HttpStatus::OK->value);
        }

        // Invalidate any existing unused OTPs for this email
        PasswordResetOtp::where('email', $email)
            ->whereNull('used_at')
            ->delete();

        $plainOtp = (string) random_int(100000, 999999);

        PasswordResetOtp::create([
            'email' => $email,
            'otp' => Hash::make($plainOtp),
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($email)->send(new OtpMail($plainOtp, $user->full_name));

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP đã được gửi đi.',
        ], HttpStatus::OK->value);
    }

    #[OA\Post(
        path: '/v1/auth/verify-otp',
        summary: 'Bước 2 — Xác nhận OTP, trả về reset_token dùng cho bước đặt lại mật khẩu (giới hạn 5 lần/phút/IP)',
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
                response: 200,
                description: 'OTP hợp lệ',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string'),
                    new OA\Property(property: 'reset_token', type: 'string'),
                ])
            ),
            new OA\Response(response: 422, description: 'OTP không hợp lệ hoặc đã hết hạn', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Step 2 — Verify the OTP and return a short-lived reset token.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'otp.required' => 'Vui lòng nhập mã OTP.',
            'otp.size' => 'Mã OTP phải có đúng 6 ký tự.',
        ]);

        $email = strtolower($request->email);

        $record = PasswordResetOtp::where('email', $email)
            ->whereNull('used_at')
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $record || $record->isExpired() || ! Hash::check($request->otp, $record->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.',
            ], HttpStatus::UNPROCESSABLE_ENTITY->value);
        }

        $plainResetToken = Str::random(64);

        $record->update([
            'reset_token' => Hash::make($plainResetToken),
            'verified_at' => now(),
            // Reuse expires_at — reset token valid for 15 minutes from now
            'expires_at' => now()->addMinutes(15),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Xác nhận OTP thành công.',
            'reset_token' => $plainResetToken,
        ], HttpStatus::OK->value);
    }

    #[OA\Post(
        path: '/v1/auth/reset-password',
        summary: 'Bước 3 — Đặt lại mật khẩu bằng reset_token nhận từ bước 2 (giới hạn 5 lần/phút/IP)',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['email', 'reset_token', 'password', 'password_confirmation'], properties: [
                new OA\Property(property: 'email', type: 'string', format: 'email'),
                new OA\Property(property: 'reset_token', type: 'string'),
                new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8),
                new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Đặt lại mật khẩu thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Tài khoản không tồn tại', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn / lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Step 3 — Reset the password using the reset token from step 2.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'reset_token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'reset_token.required' => 'Token không hợp lệ.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        $email = strtolower($request->email);

        $record = PasswordResetOtp::where('email', $email)
            ->whereNotNull('verified_at')
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (
            ! $record ||
            $record->isExpired() ||
            ! $record->reset_token ||
            ! Hash::check($request->reset_token, $record->reset_token)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.',
            ], HttpStatus::UNPROCESSABLE_ENTITY->value);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản không tồn tại.',
            ], HttpStatus::NOT_FOUND->value);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Revoke all existing tokens so old sessions are invalidated
        $user->tokens()->delete();

        $record->update(['used_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        ], HttpStatus::OK->value);
    }
}
