<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Force guard_name on roles & permissions to 'web'.
     * Fixes legacy rows created when default guard was 'sanctum',
     * which prevented assignRole()/givePermissionTo() from matching.
     */
    public function up(): void
    {
        DB::table('roles')->update(['guard_name' => 'web']);
        DB::table('permissions')->update(['guard_name' => 'web']);
    }

    public function down(): void
    {
        // no-op: we don't want to revert to the old (wrong) guard
    }
};
