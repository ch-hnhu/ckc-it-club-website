<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')
                ->nullable()
                ->constrained('certificate_templates')
                ->nullOnDelete(); // giữ cert nếu template bị xoá
            $table->enum('track', ['offline', 'online']);
            $table->string('cert_code')->unique(); // mã xác minh, generate khi cấp
            $table->string('cert_url')->nullable(); // URL file PDF
            $table->boolean('has_physical')->default(false);
            $table->timestamp('issued_at');

            $table->timestamps();

            $table->unique(['user_id', 'course_id', 'track']);
            $table->index(['user_id', 'issued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_certificates');
    }
};
