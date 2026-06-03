<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('posts', 'pinned_at')) {
            return;
        }

        Schema::table('posts', function (Blueprint $table) {
            $table->timestamp('pinned_at')->nullable()->after('is_pinned');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('posts', 'pinned_at')) {
            return;
        }

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('pinned_at');
        });
    }
};
