<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\ProductController;

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

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User routes
        Route::get('/user', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user(),
            ]);
        });

        // Products CRUD
        Route::apiResource('products', ProductController::class);

        // Example: Custom routes
        // Route::get('/products/{id}/related', [ProductController::class, 'related']);
    });
});

// Route::prefix('v2')->group(function () {
// V2 routes here
// });
