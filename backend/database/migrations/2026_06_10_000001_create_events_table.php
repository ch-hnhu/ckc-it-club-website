<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->longText('content')->nullable();
            $table->string('feedback_form_url', 2048)->nullable();
            $table->text('thumbnail')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->timestamp('registration_start_at')->nullable();
            $table->timestamp('registration_end_at')->nullable();
            $table->string('location')->nullable();
            $table->unsignedInteger('max_attendees')->nullable();
            $table->boolean('is_members_only')->default(false);
            $table->enum('status', ['draft', 'published', 'ongoing', 'ended', 'cancelled'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'start_at']);
            $table->index(['created_by', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
