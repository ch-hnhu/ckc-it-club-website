<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            ClubInformationSeeder::class,
            ClubInformationValueSeeder::class,
            DepartmentSeeder::class,
            FacultySeeder::class,
            MajorSeeder::class,
            SchoolClassSeeder::class,
            ContactSeeder::class,
            ApplicationQuestionSeeder::class,
            ApplicationQuestionOptionSeeder::class,
            ClubApplicationSeeder::class,
            ApplicationAnswerSeeder::class,
        ]);
    }
}
