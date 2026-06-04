<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\AuthBaseController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends AuthBaseController
{
	/**
	 * Verify token from OAuth callback (public endpoint)
	 */
	public function verifyToken(Request $request): JsonResponse
	{
		$token = $request->query('token');

		if (! $token) {
			return response()->json([
				'success' => false,
				'message' => 'Token is required',
			], 400);
		}

		// Find token in database
		$tokenModel = PersonalAccessToken::findToken($token);

		if (! $tokenModel) {
			return response()->json([
				'success' => false,
				'message' => 'Invalid token',
			], 401);
		}

		// Get user from token
		$user = $tokenModel->tokenable;

		if (! $user) {
			return response()->json([
				'success' => false,
				'message' => 'User not found',
			], 404);
		}

		// Return user data
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
			],
			'token' => $token,
		], 200);
	}

	/**
	 * Get authenticated user info
	 */
	public function me(Request $request): JsonResponse
	{
		return parent::me($request);
	}

	/**
	 * Logout user and revoke token
	 */
	public function logout(Request $request): JsonResponse
	{
		return parent::logout($request);
	}

	/**
	 * Logout user from all devices
	 */
	public function logoutAll(Request $request): JsonResponse
	{
		return parent::logoutAll($request);
	}

	/**
	 * Change password for the authenticated user.
	 * OAuth-only accounts (no password set) are rejected.
	 */
	public function changePassword(Request $request): JsonResponse
	{
		$user = $request->user();

		if (! $user->password) {
			return response()->json([
				'success' => false,
				'message' => 'Tài khoản của bạn đăng nhập qua mạng xã hội, không thể đổi mật khẩu tại đây.',
			], 422);
		}

		$request->validate([
			'current_password'          => ['required', 'string'],
			'new_password'              => ['required', 'string', 'min:8', 'confirmed'],
			'new_password_confirmation' => ['required', 'string'],
		], [
			'current_password.required'          => 'Vui lòng nhập mật khẩu hiện tại.',
			'new_password.required'              => 'Vui lòng nhập mật khẩu mới.',
			'new_password.min'                   => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
			'new_password.confirmed'             => 'Xác nhận mật khẩu mới không khớp.',
			'new_password_confirmation.required' => 'Vui lòng xác nhận mật khẩu mới.',
		]);

		if (! Hash::check($request->current_password, $user->password)) {
			return response()->json([
				'success' => false,
				'message' => 'Mật khẩu hiện tại không đúng.',
			], 422);
		}

		$user->update(['password' => Hash::make($request->new_password)]);

		// Revoke all other tokens so other sessions are invalidated
		$user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

		return response()->json([
			'success' => true,
			'message' => 'Đổi mật khẩu thành công.',
		]);
	}
}
