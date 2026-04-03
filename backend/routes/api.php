<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Admin\ApplicationQuestionController;
use App\Http\Controllers\Api\V1\Admin\ClubApplicationController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\FacultyController;
use App\Http\Controllers\Api\V1\Admin\MajorController;
use App\Http\Controllers\Api\V1\Admin\SchoolClassController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'API is running',
            'version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    Route::get('/auth/verify-token', [AuthController::class, 'verifyToken']);

    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);

        Route::apiResource('users', UserController::class);
        Route::apiResource('faculties', FacultyController::class)->only(['index']);
        Route::apiResource('majors', MajorController::class)->only(['index']);
        Route::apiResource('school-classes', SchoolClassController::class)->only(['index']);

        Route::get('club-applications', [ClubApplicationController::class, 'index']);
        Route::patch('club-applications/{clubApplication}/status', [ClubApplicationController::class, 'updateStatus']);
        Route::patch('application-questions/reorder', [ApplicationQuestionController::class, 'reorder']);
        Route::apiResource('application-questions', ApplicationQuestionController::class);
    });
});
