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
		Schema::create('club_information_values', function (Blueprint $table) {
			$table->id();
			$table->unsignedBigInteger('club_information_id');
			$table->string('value');
			$table->boolean('is_active')->default(true);

			$table->dateTime('created_at')->nullable();
			$table->unsignedBigInteger('created_by')->nullable();
			$table->dateTime('updated_at')->nullable();
			$table->unsignedBigInteger('updated_by')->nullable();
			$table->dateTime('deleted_at')->nullable();
			$table->unsignedBigInteger('deleted_by')->nullable();

			$table->foreign('club_information_id')->references('id')->on('club_informations');

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
		Schema::dropIfExists('club_information_values');
	}
};
