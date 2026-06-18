<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
            $table->string('content')->nullable(); // null nếu chỉ có ảnh
            $table->string('image')->nullable();
            // Dùng cho multiple_choice, multiple_select, fill_blank.
            // matching và ordering: luôn false, correctness nằm trong metadata.
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('order')->default(0);
            // matching: {"side": "left"|"right", "pair_id": 1}
            // ordering: {"correct_position": 1}
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['question_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_question_options');
    }
};
