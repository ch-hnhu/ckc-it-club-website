<?php

namespace App\Console\Commands;

use App\Models\Level;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Đồng bộ lại level_id của toàn bộ user dựa trên total_points và bảng levels.
 * Chạy sau khi admin thay đổi ngưỡng điểm của các cấp độ.
 */
class RecomputeUserLevels extends Command
{
    protected $signature = 'gamification:recompute-levels';

    protected $description = 'Tính lại cấp độ (level_id) cho toàn bộ user theo total_points hiện tại';

    public function handle(): int
    {
        $levels = Level::query()->orderByDesc('min_points')->get();

        if ($levels->isEmpty()) {
            $this->warn('Chưa có cấp độ nào trong bảng levels.');

            return self::SUCCESS;
        }

        $updated = 0;

        User::query()->select('id', 'total_points', 'level_id')->chunkById(500, function ($users) use ($levels, &$updated) {
            foreach ($users as $user) {
                $levelId = $levels->firstWhere(fn (Level $l) => $l->min_points <= $user->total_points)?->id;

                if ($user->level_id !== $levelId) {
                    $user->level_id = $levelId;
                    $user->saveQuietly();
                    $updated++;
                }
            }
        });

        $this->info("Đã cập nhật cấp độ cho {$updated} user.");

        return self::SUCCESS;
    }
}
