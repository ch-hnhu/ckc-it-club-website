<?php

namespace App\Console\Commands;

use App\Models\Rank;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Đồng bộ lại rank_id của toàn bộ user dựa trên total_points và bảng ranks.
 * Chạy sau khi admin thay đổi ngưỡng điểm của các rank.
 */
class RecomputeUserRanks extends Command
{
    protected $signature = 'gamification:recompute-ranks';

    protected $description = 'Tính lại rank_id cho toàn bộ user theo total_points hiện tại';

    public function handle(): int
    {
        $ranks = Rank::query()->orderByDesc('min_points')->get();

        if ($ranks->isEmpty()) {
            $this->warn('Chưa có rank nào trong bảng ranks.');

            return self::SUCCESS;
        }

        $updated = 0;

        User::query()->select('id', 'total_points', 'rank_id')->chunkById(500, function ($users) use ($ranks, &$updated) {
            foreach ($users as $user) {
                $rankId = $ranks->firstWhere(fn (Rank $rank) => $rank->min_points <= $user->total_points)?->id;

                if ($user->rank_id !== $rankId) {
                    $user->rank_id = $rankId;
                    $user->saveQuietly();
                    $updated++;
                }
            }
        });

        $this->info("Đã cập nhật rank cho {$updated} user.");

        return self::SUCCESS;
    }
}
