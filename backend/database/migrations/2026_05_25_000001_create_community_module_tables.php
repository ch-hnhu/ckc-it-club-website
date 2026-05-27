<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('channels', function (Blueprint $table) {
			$table->id();
			$table->string('name');
			$table->string('slug')->unique();
			$table->text('description')->nullable();
			$table->text('image')->nullable();
			$table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamps();
			$table->softDeletes();
		});

		Schema::create('posts', function (Blueprint $table) {
			$table->id();
			$table->foreignId('user_id')->constrained('users');
			$table->foreignId('channel_id')->constrained('channels');
			$table->string('title');
			$table->longText('content');
			$table->json('media_urls')->nullable();
			$table->enum('visibility', ['public', 'members', 'private'])->default('public');
			$table->enum('status', ['draft', 'published', 'hidden'])->default('draft');
			$table->timestamps();

			$table->index(['channel_id', 'status', 'created_at']);
			$table->index(['user_id', 'created_at']);
		});

		Schema::create('post_reports', function (Blueprint $table) {
			$table->id();
			$table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
			$table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
			$table->enum('reason', ['spam', 'offensive', 'misinformation', 'inappropriate', 'other']);
			$table->text('description')->nullable();
			$table->enum('status', ['pending', 'reviewing', 'resolved', 'dismissed'])->default('pending');
			$table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamp('resolved_at')->nullable();
			$table->timestamp('created_at')->nullable();

			$table->unique(['post_id', 'reporter_id']);
			$table->index(['status', 'created_at']);
		});

		Schema::create('comments', function (Blueprint $table) {
			$table->id();
			$table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
			$table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
			$table->foreignId('parent_id')->nullable()->constrained('comments')->nullOnDelete();
			$table->text('content');
			$table->unsignedTinyInteger('depth')->default(0);
			$table->timestamps();
			$table->softDeletes();

			$table->index(['post_id', 'parent_id', 'created_at']);
		});

		Schema::create('reactions', function (Blueprint $table) {
			$table->id();
			$table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
			$table->enum('target_type', ['post', 'comment', 'blog']);
			$table->unsignedBigInteger('target_id');
			$table->enum('type', ['heart', 'like', 'haha', 'wow', 'sad'])->default('heart');
			$table->timestamp('created_at')->nullable();

			$table->unique(['user_id', 'target_type', 'target_id']);
			$table->index(['target_type', 'target_id']);
		});

		Schema::create('chat_rooms', function (Blueprint $table) {
			$table->id();
			$table->enum('type', ['direct', 'group'])->default('direct');
			$table->string('name')->nullable();
			$table->timestamp('last_message_at')->nullable();
			$table->timestamps();

			$table->index(['type', 'last_message_at']);
		});

		Schema::create('chat_members', function (Blueprint $table) {
			$table->foreignId('room_id')->constrained('chat_rooms')->cascadeOnDelete();
			$table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
			$table->enum('role', ['admin', 'member'])->default('member');
			$table->timestamp('last_read_at')->nullable();
			$table->timestamps();

			$table->primary(['room_id', 'user_id']);
			$table->index(['user_id', 'last_read_at']);
		});

		Schema::create('messages', function (Blueprint $table) {
			$table->id();
			$table->foreignId('room_id')->constrained('chat_rooms')->cascadeOnDelete();
			$table->text('content')->nullable();
			$table->enum('type', ['text', 'image', 'file', 'system'])->default('text');
			$table->foreignId('reply_to_id')->nullable()->constrained('messages')->nullOnDelete();
			$table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamps();
			$table->softDeletes();

			$table->index(['room_id', 'created_at']);
		});

		Schema::create('tags', function (Blueprint $table) {
			$table->id();
			$table->string('name');
			$table->string('slug')->unique();
			$table->text('description')->nullable();
			$table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamps();
			$table->softDeletes();
		});

		Schema::create('blogs', function (Blueprint $table) {
			$table->id();
			$table->foreignId('author_id')->constrained('users');
			$table->string('title');
			$table->string('slug')->unique();
			$table->longText('content');
			$table->text('excerpt')->nullable();
			$table->text('cover_image')->nullable();
			$table->enum('status', ['draft', 'pending_review', 'published', 'archived'])->default('draft');
			$table->timestamp('published_at')->nullable();
			$table->unsignedBigInteger('view_count')->default(0);
			$table->timestamps();

			$table->index(['author_id', 'status', 'published_at']);
		});

		Schema::create('blog_tags', function (Blueprint $table) {
			$table->foreignId('blog_id')->constrained('blogs')->cascadeOnDelete();
			$table->foreignId('tag_id')->constrained('tags')->cascadeOnDelete();
			$table->timestamps();

			$table->primary(['blog_id', 'tag_id']);
		});

		Schema::create('media_files', function (Blueprint $table) {
			$table->id();
			$table->foreignId('owner_id')->constrained('users');
			$table->text('url');
			$table->enum('file_type', ['image', 'video', 'document', 'gif']);
			$table->unsignedInteger('size_kb')->default(0);
			$table->enum('target_type', ['post', 'message', 'blog']);
			$table->unsignedBigInteger('target_id');
			$table->timestamps();

			$table->index(['owner_id', 'created_at']);
			$table->index(['target_type', 'target_id']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('media_files');
		Schema::dropIfExists('blog_tags');
		Schema::dropIfExists('blogs');
		Schema::dropIfExists('tags');
		Schema::dropIfExists('messages');
		Schema::dropIfExists('chat_members');
		Schema::dropIfExists('chat_rooms');
		Schema::dropIfExists('reactions');
		Schema::dropIfExists('comments');
		Schema::dropIfExists('post_reports');
		Schema::dropIfExists('posts');
		Schema::dropIfExists('channels');
	}
};
