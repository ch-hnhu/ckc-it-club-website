<?php

namespace App\Console\Commands;

use App\Services\RankSyncService;
use Illuminate\Console\Command;

/**
 * Đồng bộ lại rank_id của toàn bộ user dựa trên total_points và bảng ranks.
 * Chạy sau khi admin thay đổi ngưỡng điểm của các rank.
 */
class RecomputeUserRanks extends Command
{
    protected $signature = 'gamification:recompute-ranks';

    protected $description = 'Tính lại rank_id cho toàn bộ user theo total_points hiện tại';

    public function handle(RankSyncService $rankSyncService): int
    {
        $updated = $rankSyncService->recomputeUserRanks();

        $this->info("Đã cập nhật rank cho {$updated} user.");

        return self::SUCCESS;
    }
}
