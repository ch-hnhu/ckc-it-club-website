<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE posts MODIFY status ENUM('draft', 'published', 'hidden', 'archived') DEFAULT 'draft'");
        }

        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false)->after('status');
            $table->timestamp('pinned_at')->nullable()->after('is_pinned');
            $table->foreignId('pinned_by')->nullable()->after('pinned_at')->constrained('users')->nullOnDelete();
            $table->timestamp('archived_at')->nullable()->after('pinned_by');
            $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->after('archived_by')->constrained('users')->nullOnDelete();
            $table->softDeletes()->after('deleted_by');

            $table->index(['is_pinned', 'pinned_at']);
            $table->index(['status', 'archived_at']);
        });

        Schema::create('post_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_bookmarks');

        DB::table('posts')
            ->where('status', 'archived')
            ->update(['status' => 'draft', 'archived_at' => null, 'archived_by' => null]);

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['is_pinned', 'pinned_at']);
            $table->dropIndex(['status', 'archived_at']);
            $table->dropConstrainedForeignId('pinned_by');
            $table->dropConstrainedForeignId('archived_by');
            $table->dropConstrainedForeignId('deleted_by');
            $table->dropSoftDeletes();
            $table->dropColumn(['is_pinned', 'pinned_at', 'archived_at']);
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE posts MODIFY status ENUM('draft', 'published', 'hidden') DEFAULT 'draft'");
        }
    }
};
