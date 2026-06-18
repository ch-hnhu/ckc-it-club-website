<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_type_id')->constrained('question_types');
            $table->text('content');
            $table->string('image')->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            // Cấu hình đặc thù theo type, vd: {"case_sensitive": false} cho fill_blank
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['quiz_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
