<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
	public function redirect()
	{
		return Socialite::driver('google')->redirect();
	}

	public function callback()
	{
		try {
			$googleUser = Socialite::driver('google')->stateless()->user();

			// tìm user
			$user = User::where('email', $googleUser->getEmail())->first();

			if (!$user) {
				$user = User::create([
					'full_name' => $googleUser->getName(),
					'email' => $googleUser->getEmail(),
					'email_verified_at' => now(),
					'password' => bcrypt(Str::random(16)),
					'provider' => 'google',
					'provider_id' => $googleUser->getId(),
					'avatar' => $googleUser->getAvatar(),
				]);
			} else {
				// cập nhật thông tin nếu user đã tồn tại
				$user->update([
					'full_name' => $googleUser->getName(),
					'avatar' => $googleUser->getAvatar(),
					'provider' => 'google',
					'provider_id' => $googleUser->getId(),
				]);
			}

			// tạo token sanctum
			$token = $user->createToken('auth_token')->plainTextToken;

			// redirect về frontend
			return redirect("http://localhost:5173/login-success?token=$token");

		} catch (\Exception $e) {
			\Log::error('Google Auth Error: ' . $e->getMessage());
			return redirect('http://localhost:5173/login')->with('error', 'Authentication failed. Please try again.');
		}
	}
}

?>