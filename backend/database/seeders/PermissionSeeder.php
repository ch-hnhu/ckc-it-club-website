<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Enums\RolesEnum;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Permission::create(['name' => 'user.view', 'description' => 'Xem thông tin người dùng']);
        Permission::create(['name' => 'user.create', 'description' => 'Tạo người dùng mới']);
        Permission::create(['name' => 'user.update', 'description' => 'Cập nhật thông tin người dùng']);
        Permission::create(['name' => 'user.delete', 'description' => 'Xóa người dùng']);

        $adminRole = Role::where('name', RolesEnum::ADMIN->value)->first();

        if ($adminRole) {
            $adminRole->givePermissionTo([
                'user.view',
                'user.create',
                'user.update',
                'user.delete',
            ]);
        }
    }
}
