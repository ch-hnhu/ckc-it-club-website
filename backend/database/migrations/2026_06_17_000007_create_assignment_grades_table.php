<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2); // 0–100
            $table->text('feedback')->nullable();
            $table->foreignId('graded_by')->constrained('users');
            $table->timestamp('graded_at');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
            $table->index(['lesson_id', 'graded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_grades');
    }
};
