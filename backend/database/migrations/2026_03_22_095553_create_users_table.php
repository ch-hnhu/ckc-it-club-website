<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->timestamp('email_verified_at')->nullable();

            $table->string('provider')->nullable();
            $table->string('provider_id')->nullable();

            $table->string('full_name')->nullable();
            $table->string('gender')->nullable();
            $table->string('avatar')->nullable();
            $table->date('dob')->nullable();

            $table->char('student_code')->unique()->nullable();

            $table->foreignId('faculty_id')->nullable();
            $table->foreignId('major_id')->nullable();
            $table->foreignId('class_id')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            $table->timestamps();

            $table->index(['provider', 'provider_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
