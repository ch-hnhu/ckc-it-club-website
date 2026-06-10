<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            'mail_templates.view' => 'Xem danh sách loại mail và template',
            'mail_templates.manage' => 'Thêm, sửa, xóa, đặt mặc định mail template; bật/tắt auto-send',
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

        $viewRoles = ['admin', 'president', 'vice-president', 'volunteer-head'];
        $manageRoles = ['admin', 'president', 'vice-president', 'volunteer-head'];

        $roleIds = DB::table('roles')
            ->where('guard_name', 'web')
            ->whereIn('name', array_unique(array_merge($viewRoles, $manageRoles)))
            ->pluck('id', 'name');

        foreach ($viewRoles as $roleName) {
            if (isset($roleIds[$roleName])) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permissionIds['mail_templates.view'],
                    'role_id' => $roleIds[$roleName],
                ]);
            }
        }

        foreach ($manageRoles as $roleName) {
            if (isset($roleIds[$roleName])) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permissionIds['mail_templates.manage'],
                    'role_id' => $roleIds[$roleName],
                ]);
            }
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        // no-op: permissions are now part of the intended baseline
    }
};
