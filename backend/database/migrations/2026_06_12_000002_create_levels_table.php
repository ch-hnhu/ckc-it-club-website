<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('min_points')->unique();
            $table->string('badge')->nullable();
            $table->timestamps();

            $table->index('min_points');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('level_id')->references('id')->on('levels')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['level_id']);
        });

        Schema::dropIfExists('levels');
    }
};
