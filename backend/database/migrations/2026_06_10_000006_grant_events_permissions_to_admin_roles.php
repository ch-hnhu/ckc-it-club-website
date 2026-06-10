<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            'events.view' => 'Xem danh sách và chi tiết sự kiện',
            'events.manage' => 'Tạo, sửa, xóa, đổi trạng thái sự kiện',
            'events.check_in' => 'Thực hiện điểm danh sự kiện',
        ];

        $permissionIds = [];
        foreach ($permissions as $name => $description) {
            $id = DB::table('permissions')
                ->where('name', $name)
                ->where('guard_name', 'web')
                ->value('id');

            if (! $id) {
                $id = DB::table('permissions')->insertGetId([
                    'name' => $name,
                    'description' => $description,
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $permissionIds[$name] = $id;
        }

        // Toàn quyền sự kiện
        $fullAccessRoles = [
            'admin',
            'president',
            'vice-president',
            'communications-head',
        ];

        $fullAccessRoleIds = DB::table('roles')
            ->whereIn('name', $fullAccessRoles)
            ->where('guard_name', 'web')
            ->pluck('id');

        foreach ($fullAccessRoleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }

        // Trưởng ban Tình nguyện — chỉ xem & điểm danh (hỗ trợ sự kiện)
        $checkInRoleIds = DB::table('roles')
            ->where('name', 'volunteer-head')
            ->where('guard_name', 'web')
            ->pluck('id');

        foreach ($checkInRoleIds as $roleId) {
            foreach (['events.view', 'events.check_in'] as $name) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permissionIds[$name],
                    'role_id' => $roleId,
                ]);
            }
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        // no-op
    }
};
