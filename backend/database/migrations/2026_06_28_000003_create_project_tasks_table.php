<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('column_id')->constrained('project_columns')->cascadeOnDelete();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['column_id', 'position']);
            $table->index(['project_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_tasks');
    }
};
