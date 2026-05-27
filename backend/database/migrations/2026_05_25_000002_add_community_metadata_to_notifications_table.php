<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('recipient_id')->nullable()->after('notifiable_id')->constrained('users')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->after('recipient_id')->constrained('users')->nullOnDelete();
            $table->enum('community_type', ['comment', 'reaction', 'mention', 'new_post', 'chat'])->nullable()->after('actor_id');
            $table->enum('target_type', ['post', 'comment', 'blog', 'message'])->nullable()->after('community_type');
            $table->unsignedBigInteger('target_id')->nullable()->after('target_type');
            $table->text('message')->nullable()->after('target_id');

            $table->index(['recipient_id', 'read_at', 'created_at'], 'notifications_recipient_read_created_index');
            $table->index(['target_type', 'target_id'], 'notifications_community_target_index');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_recipient_read_created_index');
            $table->dropIndex('notifications_community_target_index');
            $table->dropForeign(['recipient_id']);
            $table->dropForeign(['actor_id']);
            $table->dropColumn([
                'recipient_id',
                'actor_id',
                'community_type',
                'target_type',
                'target_id',
                'message',
            ]);
        });
    }
};
