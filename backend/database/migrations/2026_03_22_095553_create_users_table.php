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
			$table->dateTime('email_verified_at')->nullable();
			$table->string('full_name')->nullable();
			$table->string('gender')->nullable();
			$table->dateTime('dob')->nullable();
			$table->char('student_code')->nullable();

			$table->unsignedBigInteger('faculty')->nullable();
			$table->unsignedBigInteger('major')->nullable();
			$table->unsignedBigInteger('class')->nullable();

			$table->boolean('is_active')->default(true);

			$table->dateTime('created_at')->nullable();
			$table->unsignedBigInteger('created_by')->nullable();
			$table->dateTime('updated_at')->nullable();
			$table->unsignedBigInteger('updated_by')->nullable();

			// FK
			$table->foreign('created_by')->references('id')->on('users');
			$table->foreign('updated_by')->references('id')->on('users');
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
