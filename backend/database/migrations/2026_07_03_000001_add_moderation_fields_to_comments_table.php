<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Lý do bị AI đánh dấu vi phạm (null = chưa/không vi phạm).
            $table->string('moderation_reason')->nullable()->after('is_hidden');
            // Thời điểm AI kiểm duyệt xong.
            $table->timestamp('moderated_at')->nullable()->after('moderation_reason');
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['moderation_reason', 'moderated_at']);
        });
    }
};
