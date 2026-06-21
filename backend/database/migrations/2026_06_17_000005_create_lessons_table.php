<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->enum('status', ['draft', 'published'])->default('draft');
            // Lịch buổi học offline - session_end dùng để tính QR còn hợp lệ không
            $table->dateTime('session_start')->nullable();
            $table->dateTime('session_end')->nullable();

            // Phần 1: Tài nguyên
            $table->string('resource_url')->nullable();
            $table->string('resource_label')->nullable();

            // Phần 2: Bài giảng (video nhúng) — tính vào progress
            $table->string('video_url')->nullable();
            $table->unsignedInteger('video_duration')->nullable(); // giây
            // YouTube live - fallback cho video_url khi mentor chưa up video bài giảng chính thức
            $table->string('live_url')->nullable();

            // Phần 3: Tài liệu (markdown)
            $table->longText('document')->nullable();

            // Phần 4: Assignment — tính vào progress
            $table->string('assignment_url')->nullable(); // Google Forms
            $table->dateTime('assignment_deadline')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['course_id', 'slug']);
            $table->index(['course_id', 'order']);
            $table->index(['course_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
