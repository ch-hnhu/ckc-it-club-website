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
            $table->timestamp('email_verified_at')->nullable();
            $table->string('full_name')->nullable();
            $table->string('gender')->nullable();
            $table->dateTime('dob')->nullable();
            $table->char('student_code')->nullable();

            $table->foreignId('faculty')->nullable();
            $table->foreignId('major')->nullable();
            $table->foreignId('class')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
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
