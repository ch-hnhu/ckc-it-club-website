<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_task_id')->constrained('board_tasks')->cascadeOnDelete();
            $table->string('content');
            $table->boolean('is_done')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['board_task_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_checklist_items');
    }
};
