<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users');
            $table->text('url');
            $table->enum('file_type', ['image', 'video', 'document', 'gif']);
            $table->unsignedInteger('size_kb')->default(0);
            $table->enum('target_type', ['post', 'message', 'blog']);
            $table->unsignedBigInteger('target_id');
            $table->timestamps();

            $table->index(['owner_id', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
