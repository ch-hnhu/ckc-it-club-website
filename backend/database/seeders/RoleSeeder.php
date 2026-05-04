<?php

namespace Database\Seeders;

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
        Role::create(['name' => RolesEnum::ADMIN->value, 'label' => 'Quản trị viên', 'is_system' => true]);
        Role::create(['name' => RolesEnum::PRESIDENT, 'label' => 'Chủ nhiệm CLB', 'is_system' => true]);
        Role::create(['name' => RolesEnum::VICE_PRESIDENT, 'label' => 'Phó Chủ nhiệm CLB', 'is_system' => true]);
        Role::create(['name' => RolesEnum::ACADEMIC_HEAD, 'label' => 'Trưởng ban Học thuật', 'is_system' => true]);
        Role::create(['name' => RolesEnum::COMMUNICATIONS_HEAD, 'label' => 'Trưởng ban Truyền thông', 'is_system' => true]);
        Role::create(['name' => RolesEnum::VOLUNTEER_HEAD, 'label' => 'Trưởng ban Tình nguyện', 'is_system' => true]);
        Role::create(['name' => RolesEnum::CLUB_MEMBER, 'label' => 'Thành viên CLB', 'is_system' => true]);
        Role::create(['name' => RolesEnum::USER, 'label' => 'Người dùng', 'is_system' => true]);
    }
}
