<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->enum('level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('enrollment_start')->nullable();
            $table->timestamp('enrollment_deadline')->nullable();
            $table->timestamp('course_end')->nullable();
            $table->unsignedSmallInteger('max_offline_slots')->nullable();
            $table->unsignedTinyInteger('max_absent_allowed')->default(1);
            $table->unsignedTinyInteger('quiz_pass_threshold')->default(80);
            // Số buổi học dự kiến của khóa; null = không giới hạn số buổi tạo được.
            $table->unsignedSmallInteger('total_lessons')->nullable();
            // FK thật được thêm ở migration create_certificate_templates_table (chạy sau, vì bảng đích chưa tồn tại ở đây).
            $table->foreignId('certificate_template_id')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('enrollment_deadline');
            $table->index('course_end');
            $table->index(['created_by', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
