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
		Schema::table('users', function (Blueprint $table) {
			$table->foreign('faculty')->references('id')->on('faculties');
			$table->foreign('major')->references('id')->on('majors');
			$table->foreign('class')->references('id')->on('school_classes');
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void
	{
		Schema::table('users', function (Blueprint $table) {
			$table->dropForeign(['faculty']);
			$table->dropForeign(['major']);
			$table->dropForeign(['class']);
		});
	}
};
