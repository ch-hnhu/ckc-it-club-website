<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
            // Câu trả lời linh hoạt theo question_type:
            // multiple_choice/select : {"selected": [option_id, ...]}
            // fill_blank             : {"text": "câu trả lời"}
            // matching               : {"pairs": [[left_id, right_id], ...]}
            // word_order             : {"order": [opt_id_1, opt_id_2, ...]}
            $table->json('answer_data');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->unique(['attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_answers');
    }
};
