<?php

namespace Tests\Feature;

use App\Mail\OtpMail;
use App\Models\RegistrationOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationUsernameTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_otp_uses_email_prefix_as_username_without_request_username(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/register', [
            'full_name' => 'Nguyen Van A',
            'email' => '0306231234@caothang.edu.vn',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $record = RegistrationOtp::query()->where('email', '0306231234@caothang.edu.vn')->firstOrFail();

        $this->assertSame('0306231234', $record->registration_data['username']);
        $this->assertSame('0306231234', $record->registration_data['student_code']);
        Mail::assertSent(OtpMail::class);
    }

    public function test_registration_verify_regenerates_username_when_pending_prefix_was_taken(): void
    {
        User::create([
            'full_name' => 'Existing User',
            'email' => 'existing@example.com',
            'username' => 'taken',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        RegistrationOtp::create([
            'email' => 'taken@example.com',
            'otp' => Hash::make('123456'),
            'registration_data' => [
                'full_name' => 'New User',
                'username' => 'taken',
                'password' => Hash::make('password123'),
                'student_code' => null,
            ],
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'email' => 'taken@example.com',
            'otp' => '123456',
        ])->assertCreated()
            ->assertJsonPath('user.email', 'taken@example.com');

        $user = User::query()->where('email', 'taken@example.com')->firstOrFail();

        $this->assertMatchesRegularExpression('/^taken_[0-9]{4}$/', $user->username);
        $this->assertNotSame('', $user->username);
    }

    public function test_credential_login_backfills_missing_username_from_email_prefix(): void
    {
        $user = User::create([
            'full_name' => 'Legacy User',
            'email' => 'legacy@example.com',
            'username' => null,
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'legacy@example.com',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('user.username', 'legacy');

        $this->assertSame('legacy', $user->fresh()->username);
    }
}
