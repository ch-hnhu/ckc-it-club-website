<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_structure_imports', function (Blueprint $table) {
            $table->id();
            $table->string('original_file_name');
            $table->string('stored_file_path')->nullable();
            $table->string('storage_disk')->default('local');
            $table->string('file_type', 20);
            $table->unsignedBigInteger('file_size_bytes')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 32)->default('completed');
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('created_faculties')->default(0);
            $table->unsignedInteger('created_majors')->default(0);
            $table->unsignedInteger('created_school_classes')->default(0);
            $table->unsignedInteger('existing_faculties')->default(0);
            $table->unsignedInteger('existing_majors')->default(0);
            $table->unsignedInteger('existing_school_classes')->default(0);
            $table->unsignedInteger('errors_count')->default(0);
            $table->text('error_message')->nullable();
            $table->json('error_details')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('file_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_structure_imports');
    }
};
