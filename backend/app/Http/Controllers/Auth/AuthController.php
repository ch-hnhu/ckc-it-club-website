<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\AuthBaseController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
                'created_at' => $user->created_at,
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
}
