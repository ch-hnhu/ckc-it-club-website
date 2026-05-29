<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('community_type', ['comment', 'reaction', 'mention', 'new_post', 'chat'])->nullable();
            $table->enum('target_type', ['post', 'comment', 'blog', 'message'])->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->text('message')->nullable();
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['recipient_id', 'read_at', 'created_at'], 'notifications_recipient_read_created_index');
            $table->index(['target_type', 'target_id'], 'notifications_community_target_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
