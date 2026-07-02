<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('kanban_boards')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('position')->default(0);
            $table->string('color', 20)->nullable();
            $table->unsignedSmallInteger('wip_limit')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['board_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_columns');
    }
};
