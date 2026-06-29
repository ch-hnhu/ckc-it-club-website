<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kanban_boards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 20)->nullable();
            $table->foreignId('department_id')->nullable()
                ->constrained('departments')->nullOnDelete();
            $table->enum('visibility', ['private', 'members', 'public'])->default('members');
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['department_id', 'is_archived']);
            $table->index(['created_by', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kanban_boards');
    }
};
