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
			$table->foreign('faculty_id')->references('id')->on('faculties');
			$table->foreign('major_id')->references('id')->on('majors');
			$table->foreign('class_id')->references('id')->on('school_classes');
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void
	{
		Schema::table('users', function (Blueprint $table) {
			$table->dropForeign(['faculty_id']);
			$table->dropForeign(['major_id']);
			$table->dropForeign(['class_id']);
		});
	}
};
