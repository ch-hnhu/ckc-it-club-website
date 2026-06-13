<?php

namespace App\Services;

use App\Models\Rank;
use App\Models\User;

class RankSyncService
{
    /**
     * Đồng bộ rank_id của toàn bộ user dựa trên total_points và bảng ranks hiện tại.
     */
    public function recomputeUserRanks(): int
    {
        $ranks = Rank::query()->orderByDesc('min_points')->get();

        if ($ranks->isEmpty()) {
            return User::query()
                ->whereNotNull('rank_id')
                ->update(['rank_id' => null]);
        }

        $updated = 0;

        User::query()->select('id', 'total_points', 'rank_id')->chunkById(500, function ($users) use ($ranks, &$updated) {
            foreach ($users as $user) {
                $rankId = $ranks->first(fn (Rank $rank) => $rank->min_points <= $user->total_points)?->id;
                $currentRankId = $user->rank_id === null ? null : (int) $user->rank_id;

                if ($currentRankId !== $rankId) {
                    $user->rank_id = $rankId;
                    $user->saveQuietly();
                    $updated++;
                }
            }
        });

        return $updated;
    }
}
