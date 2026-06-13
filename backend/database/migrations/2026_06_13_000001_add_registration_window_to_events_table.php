<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Khoảng thời gian mở đăng ký; null = không giới hạn (mở đến khi sự kiện bắt đầu)
            $table->timestamp('registration_start_at')->nullable()->after('end_at');
            $table->timestamp('registration_end_at')->nullable()->after('registration_start_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['registration_start_at', 'registration_end_at']);
        });
    }
};
