<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_feedbacks', function (Blueprint $table) {
            // Nhận xét bị ẩn do AI đánh dấu vi phạm (rating vẫn được tính vào thống kê).
            $table->boolean('is_hidden')->default(false)->after('comment');
            // Lý do bị AI đánh dấu vi phạm (null = chưa/không vi phạm).
            $table->string('moderation_reason')->nullable()->after('is_hidden');
            // Thời điểm AI kiểm duyệt xong.
            $table->timestamp('moderated_at')->nullable()->after('moderation_reason');
        });
    }

    public function down(): void
    {
        Schema::table('event_feedbacks', function (Blueprint $table) {
            $table->dropColumn(['is_hidden', 'moderation_reason', 'moderated_at']);
        });
    }
};
