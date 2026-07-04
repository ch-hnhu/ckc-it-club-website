<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploader_id')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('link_type', ['google_drive', 'youtube', 'github', 'document', 'other'])->default('other');
            $table->string('url');
            $table->enum('status', ['pending_review', 'published', 'rejected', 'hidden'])->default('pending_review');
            $table->unsignedBigInteger('click_count')->default(0);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
            $table->index(['uploader_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
