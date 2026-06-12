<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('point_rule_id')->constrained()->cascadeOnDelete();
            $table->integer('points');
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Weekly leaderboard & lịch sử của user
            $table->index(['user_id', 'created_at']);
            // Chống cộng điểm trùng cùng một source
            $table->index(['point_rule_id', 'source_type', 'source_id']);
            // Kiểm tra max_per_day / max_per_week
            $table->index(['user_id', 'point_rule_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
