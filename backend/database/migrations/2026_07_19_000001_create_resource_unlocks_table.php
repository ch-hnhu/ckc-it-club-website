<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ghim cứng suất xem miễn phí của sinh viên Cao Thắng: mỗi hàng là một
        // tài nguyên đã được cấp cho user và giữ nguyên về sau, thay vì tính lại
        // "3 cái mới nhất" ở mỗi lần xem (khiến tài nguyên đang mở bị khoá lại
        // khi có bài mới được duyệt).
        Schema::create('resource_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('resource_id')->constrained('resources')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'resource_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_unlocks');
    }
};
