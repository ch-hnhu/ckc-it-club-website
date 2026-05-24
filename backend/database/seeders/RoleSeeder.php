<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use App\Enums\RolesEnum;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roles = [
            ['name' => RolesEnum::ADMIN->value, 'label' => 'Quản trị viên', 'is_system' => true],
            ['name' => RolesEnum::PRESIDENT->value, 'label' => 'Chủ nhiệm CLB', 'is_system' => true],
            ['name' => RolesEnum::VICE_PRESIDENT->value, 'label' => 'Phó Chủ nhiệm CLB', 'is_system' => true],
            ['name' => RolesEnum::ACADEMIC_HEAD->value, 'label' => 'Trưởng ban Học thuật', 'is_system' => true],
            ['name' => RolesEnum::COMMUNICATIONS_HEAD->value, 'label' => 'Trưởng ban Truyền thông', 'is_system' => true],
            ['name' => RolesEnum::VOLUNTEER_HEAD->value, 'label' => 'Trưởng ban Tình nguyện', 'is_system' => true],
            ['name' => RolesEnum::CLUB_MEMBER->value, 'label' => 'Thành viên CLB', 'is_system' => true],
            ['name' => RolesEnum::USER->value, 'label' => 'Người dùng', 'is_system' => true],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name'], 'guard_name' => 'web'],
                ['label' => $role['label'], 'is_system' => $role['is_system']],
            );
        }

    }
}
