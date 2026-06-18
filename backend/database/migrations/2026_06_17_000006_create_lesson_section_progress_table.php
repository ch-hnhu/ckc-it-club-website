<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Track completion của từng phần bên trong lesson (video, assignment, quiz).
        // Lesson đạt 100% khi tất cả section_type có is_completed = true.
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->enum('section_type', ['video', 'assignment', 'quiz'])->default('video');
            $table->boolean('is_completed')->default(false);
            // Điểm thực tế: null với video, 0–100 với assignment/quiz
            $table->decimal('score', 5, 2)->nullable();
            // Phần trăm đã xem: chỉ dùng với video (0–100), null với các loại khác
            $table->unsignedTinyInteger('watch_percentage')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id', 'section_type']);
            $table->index(['lesson_id', 'section_type']);
            $table->index(['user_id', 'is_completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};
