<?php

use App\Enums\RolesEnum;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Admin\ApplicationQuestionController;
use App\Http\Controllers\Api\V1\Admin\ClubApplicationController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Auth\AuthBaseController;
use App\Http\Controllers\Auth\AuthController;

// API Version 1
Route::prefix('v1')->group(function () {

    // Public routes
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'API is running',
            'version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Token verification (public for OAuth callback)
    Route::get('/auth/verify-token', [AuthController::class, 'verifyToken']);

    // Authentication routes (require authentication)
    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/', [DashboardController::class, 'index']);

        Route::apiResource('users', UserController::class);
        Route::get('club-applications', [ClubApplicationController::class, 'index']);
        Route::patch('club-applications/{clubApplication}/status', [ClubApplicationController::class, 'updateStatus']);
        Route::patch('application-questions/reorder', [ApplicationQuestionController::class, 'reorder']);
        Route::apiResource('application-questions', ApplicationQuestionController::class);

        // Example: Custom routes
        // Route::get('/products/{id}/related', [ProductController::class, 'related']);
    });
});

// Route::prefix('v2')->group(function () {
// V2 routes here
// });
