<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleAuthController;

// OAuth Routes (use web middleware for session)
Route::get('/admin/auth/google', [GoogleAuthController::class, 'redirectAdmin']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::get('/user/auth/google', [GoogleAuthController::class, 'redirectUser']);

Route::get('/', function () {
    return view('welcome');
});
