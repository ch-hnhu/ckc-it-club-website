<?php

namespace App\Jobs;

use App\Services\RankSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RecomputeUserRanksJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function handle(RankSyncService $rankSyncService): void
    {
        $updated = $rankSyncService->recomputeUserRanks();

        Log::info('Recomputed user ranks after rank rule changes.', [
            'updated_users' => $updated,
        ]);
    }
}
