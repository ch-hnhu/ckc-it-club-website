<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Enums\RolesEnum;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create(['name' => RolesEnum::ADMIN->value]);
        Role::create(['name' => RolesEnum::PRESIDENT->value]);
        Role::create(['name' => RolesEnum::VICE_PRESIDENT->value]);
        Role::create(['name' => RolesEnum::ACADEMIC_HEAD->value]);
        Role::create(['name' => RolesEnum::COMMUNICATIONS_HEAD->value]);
        Role::create(['name' => RolesEnum::VOLUNTEER_HEAD->value]);
        Role::create(['name' => RolesEnum::CLUB_MEMBER->value]);
        Role::create(['name' => RolesEnum::USER->value]);
    }
}
