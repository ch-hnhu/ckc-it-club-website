<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['qr', 'manual'])->default('qr');
            $table->text('note')->nullable();
            $table->timestamp('attended_at');
            $table->foreignId('recorded_by')->constrained('users');

            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
            $table->index(['lesson_id', 'attended_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_attendances');
    }
};
