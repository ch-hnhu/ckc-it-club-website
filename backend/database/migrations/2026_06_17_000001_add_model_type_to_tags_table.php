<?php

use App\Enums\TagModelType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('model_type')->default(TagModelType::BLOG->value)->after('id');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['model_type', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique(['model_type', 'slug']);
            $table->unique(['slug']);
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn('model_type');
        });
    }
};
