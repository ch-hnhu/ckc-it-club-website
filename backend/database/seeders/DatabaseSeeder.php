<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            FacultySeeder::class,
            MajorSeeder::class,
            SchoolClassSeeder::class,
            UserSeeder::class,
            ContactSeeder::class,
            ApplicationQuestionSeeder::class,
            ApplicationQuestionOptionSeeder::class,
            ClubApplicationSeeder::class,
            ApplicationAnswerSeeder::class,
        ]);
    }
}
