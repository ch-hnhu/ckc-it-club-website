<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'Administrator',
                'is_active' => true,
            ]
        );

        for ($i = 1; $i <= 4; $i++) {
            User::firstOrCreate(
                ['email' => "student{$i}@gmail.com"],
                [
                    'full_name' => "Student {$i}",
                    'student_code' => "CD22000{$i}",
                    'is_active' => true,
                ]
            );
        }
    }
}
