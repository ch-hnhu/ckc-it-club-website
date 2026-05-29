<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->foreignId('blog_id')->nullable()->constrained('blogs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('comments')->nullOnDelete();
            $table->text('content');
            $table->unsignedTinyInteger('depth')->default(0);
            $table->boolean('is_hidden')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['post_id', 'parent_id', 'created_at']);
            $table->index(['blog_id', 'parent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
