<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Đổi nghĩa: đăng ký luôn khả dụng, cờ này chỉ giới hạn đối tượng
            // (bật = chỉ thành viên CLB mới được đăng ký)
            $table->renameColumn('is_registration_required', 'is_members_only');
        });

        DB::statement('ALTER TABLE events MODIFY is_members_only TINYINT(1) NOT NULL DEFAULT 0');

        // Sự kiện hiện có: mở cho mọi sinh viên
        DB::table('events')->update(['is_members_only' => false]);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->renameColumn('is_members_only', 'is_registration_required');
        });

        DB::statement('ALTER TABLE events MODIFY is_registration_required TINYINT(1) NOT NULL DEFAULT 1');
    }
};
