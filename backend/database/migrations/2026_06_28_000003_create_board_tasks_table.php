<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('kanban_boards')->cascadeOnDelete();
            $table->foreignId('column_id')->constrained('board_columns')->cascadeOnDelete();
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
            $table->index(['board_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_tasks');
    }
};
