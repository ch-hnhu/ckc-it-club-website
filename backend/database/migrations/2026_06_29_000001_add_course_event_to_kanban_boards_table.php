<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kanban_boards', function (Blueprint $table) {
            // Liên kết tuỳ chọn: board phục vụ cho 1 khoá học và/hoặc 1 sự kiện.
            $table->foreignId('course_id')->nullable()->after('department_id')
                ->constrained('courses')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->after('course_id')
                ->constrained('events')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('kanban_boards', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropForeign(['event_id']);
            $table->dropColumn(['course_id', 'event_id']);
        });
    }
};
