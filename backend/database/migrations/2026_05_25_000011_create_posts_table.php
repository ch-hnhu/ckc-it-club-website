<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('channel_id')->constrained('channels');
            $table->string('title');
            $table->longText('content');
            $table->json('media_urls')->nullable();
            $table->enum('visibility', ['public', 'members', 'private'])->default('public');
            $table->enum('status', ['draft', 'published', 'hidden', 'archived'])->default('draft');
            $table->boolean('is_pinned')->default(false);
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['channel_id', 'status', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'is_pinned']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
