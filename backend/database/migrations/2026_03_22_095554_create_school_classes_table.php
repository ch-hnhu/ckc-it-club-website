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
		Schema::create('school_classes', function (Blueprint $table) {
			$table->id();
			$table->string('value');
			$table->string('label');
			$table->string('slug');

			$table->unsignedBigInteger('major_id');

			$table->dateTime('created_at')->nullable();
			$table->unsignedBigInteger('created_by')->nullable();
			$table->dateTime('updated_at')->nullable();
			$table->unsignedBigInteger('updated_by')->nullable();
			$table->dateTime('deleted_at')->nullable();
			$table->unsignedBigInteger('deleted_by')->nullable();

			$table->foreign('major_id')->references('id')->on('majors');
			$table->foreign('created_by')->references('id')->on('users');
			$table->foreign('updated_by')->references('id')->on('users');
			$table->foreign('deleted_by')->references('id')->on('users');
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void
	{
		Schema::dropIfExists('school_classes');
	}
};
