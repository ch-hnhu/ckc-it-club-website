<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\AuthBaseController;

// OAuth Routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// Generic OAuth Routes (for future providers)
Route::get('/auth/{provider}', [AuthBaseController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [AuthBaseController::class, 'callback']);

Route::get('/', function () {
	return view('welcome');
});
