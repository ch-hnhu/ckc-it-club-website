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
            $table->string('username', 30)->nullable()->unique();
            $table->string('password')->nullable();
            $table->timestamp('email_verified_at')->nullable();

            $table->string('provider')->nullable();
            $table->string('provider_id')->nullable();

            $table->string('full_name')->nullable();
            $table->string('gender')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('bio', 500)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('social_github', 100)->nullable();
            $table->string('social_linkedin', 100)->nullable();
            $table->string('social_instagram', 100)->nullable();
            $table->string('social_youtube', 100)->nullable();
            $table->string('social_tiktok', 100)->nullable();
            $table->string('social_twitch', 100)->nullable();

            $table->char('student_code', 15)->unique()->nullable();

            $table->foreignId('faculty_id')->nullable();
            $table->foreignId('major_id')->nullable();
            $table->foreignId('class_id')->nullable();

            $table->boolean('is_active')->default(true);

            $table->unsignedInteger('total_points')->default(0);
            $table->foreignId('rank_id')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            $table->timestamps();

            $table->index(['provider', 'provider_id']);
            $table->index('total_points');
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
