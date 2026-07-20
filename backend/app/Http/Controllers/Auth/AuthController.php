<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\AuthBaseController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Attributes as OA;

class AuthController extends AuthBaseController
{
	#[OA\Get(
		path: '/v1/auth/verify-token',
		summary: 'Xác thực token nhận được từ OAuth callback (redirect popup)',
		tags: ['Auth'],
		parameters: [
			new OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
		],
		responses: [
			new OA\Response(
				response: 200,
				description: 'Token hợp lệ, trả về thông tin user',
				content: new OA\JsonContent(
					properties: [
						new OA\Property(property: 'success', type: 'boolean', example: true),
						new OA\Property(property: 'data', ref: '#/components/schemas/User'),
						new OA\Property(property: 'token', type: 'string'),
					]
				)
			),
			new OA\Response(response: 400, description: 'Thiếu token', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
			new OA\Response(response: 401, description: 'Token không hợp lệ', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
			new OA\Response(response: 404, description: 'Không tìm thấy user', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
		]
	)]
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

	#[OA\Get(
		path: '/v1/auth/me',
		summary: 'Lấy thông tin user đang đăng nhập (kèm roles, permissions)',
		security: [['sanctum' => []]],
		tags: ['Auth'],
		responses: [
			new OA\Response(
				response: 200,
				description: 'Thành công',
				content: new OA\JsonContent(
					properties: [
						new OA\Property(property: 'success', type: 'boolean', example: true),
						new OA\Property(property: 'data', properties: [
							new OA\Property(property: 'id', type: 'integer'),
							new OA\Property(property: 'full_name', type: 'string'),
							new OA\Property(property: 'email', type: 'string'),
							new OA\Property(property: 'username', type: 'string'),
							new OA\Property(property: 'avatar', type: 'string', nullable: true),
							new OA\Property(property: 'roles', type: 'array', items: new OA\Items(properties: [
								new OA\Property(property: 'name', type: 'string'),
								new OA\Property(property: 'label', type: 'string'),
							])),
							new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(type: 'string')),
							new OA\Property(property: 'is_school_student', type: 'boolean'),
						], type: 'object'),
					]
				)
			),
			new OA\Response(response: 401, description: 'Chưa đăng nhập', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
		]
	)]
	/**
	 * Get authenticated user info
	 */
	public function me(Request $request): JsonResponse
	{
		return parent::me($request);
	}

	#[OA\Post(
		path: '/v1/auth/logout',
		summary: 'Đăng xuất — thu hồi access token hiện tại',
		security: [['sanctum' => []]],
		tags: ['Auth'],
		responses: [
			new OA\Response(response: 200, description: 'Đăng xuất thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
			new OA\Response(response: 401, description: 'Chưa đăng nhập', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
		]
	)]
	/**
	 * Logout user and revoke token
	 */
	public function logout(Request $request): JsonResponse
	{
		return parent::logout($request);
	}

	#[OA\Post(
		path: '/v1/auth/logout-all',
		summary: 'Đăng xuất khỏi tất cả thiết bị — thu hồi toàn bộ token',
		security: [['sanctum' => []]],
		tags: ['Auth'],
		responses: [
			new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
			new OA\Response(response: 401, description: 'Chưa đăng nhập', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
		]
	)]
	/**
	 * Logout user from all devices
	 */
	public function logoutAll(Request $request): JsonResponse
	{
		return parent::logoutAll($request);
	}

	#[OA\Post(
		path: '/v1/auth/change-password',
		summary: 'Đổi mật khẩu (chỉ áp dụng cho tài khoản có mật khẩu, không áp dụng cho tài khoản OAuth)',
		security: [['sanctum' => []]],
		tags: ['Auth'],
		requestBody: new OA\RequestBody(
			required: true,
			content: new OA\JsonContent(
				required: ['current_password', 'new_password', 'new_password_confirmation'],
				properties: [
					new OA\Property(property: 'current_password', type: 'string', format: 'password'),
					new OA\Property(property: 'new_password', type: 'string', format: 'password', minLength: 8),
					new OA\Property(property: 'new_password_confirmation', type: 'string', format: 'password'),
				]
			)
		),
		responses: [
			new OA\Response(response: 200, description: 'Đổi mật khẩu thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
			new OA\Response(response: 422, description: 'Mật khẩu hiện tại sai / tài khoản OAuth / lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
		]
	)]
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
