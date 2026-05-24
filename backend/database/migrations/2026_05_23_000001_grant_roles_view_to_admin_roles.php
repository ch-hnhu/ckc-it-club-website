<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Allow every admin-capable role to view the role list.
     */
    public function up(): void
    {
        $permissionId = DB::table('permissions')
            ->where('name', 'roles.view')
            ->where('guard_name', 'web')
            ->value('id');

        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'roles.view',
                'description' => 'Xem danh sách vai trò',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $adminRoleNames = [
            'admin',
            'president',
            'vice-president',
            'academic-head',
            'communications-head',
            'volunteer-head',
        ];

        $roleIds = DB::table('roles')
            ->whereIn('name', $adminRoleNames)
            ->where('guard_name', 'web')
            ->pluck('id');

        foreach ($roleIds as $roleId) {
            DB::table('role_has_permissions')->insertOrIgnore([
                'permission_id' => $permissionId,
                'role_id' => $roleId,
            ]);
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        // no-op: this permission is now part of the intended admin role baseline.
    }
};
