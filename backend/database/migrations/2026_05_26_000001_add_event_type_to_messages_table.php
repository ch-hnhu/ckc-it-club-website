<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Phân loại sự kiện hệ thống trong phòng chat
            // Ví dụ: member_joined, member_left, room_renamed, avatar_changed, ...
            $table->string('event_type', 50)->nullable()->after('type');

            $table->index(['room_id', 'event_type'], 'messages_room_event_type_index');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_room_event_type_index');
            $table->dropColumn('event_type');
        });
    }
};
