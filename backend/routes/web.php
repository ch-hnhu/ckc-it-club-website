<?php

use App\Http\Controllers\Auth\GitHubAuthController;
use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

// Google OAuth
Route::get('/admin/auth/google', [GoogleAuthController::class, 'redirectAdmin']);
Route::get('/user/auth/google', [GoogleAuthController::class, 'redirectUser']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// GitHub OAuth
Route::get('/admin/auth/github', [GitHubAuthController::class, 'redirectAdmin']);
Route::get('/user/auth/github', [GitHubAuthController::class, 'redirectUser']);
Route::get('/auth/github/callback', [GitHubAuthController::class, 'callback']);

Route::get('/', function () {
    return view('welcome');
});
