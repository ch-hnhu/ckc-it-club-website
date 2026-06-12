<?php

namespace App\Observers;

use App\Models\Reaction;
use App\Services\PointService;

class ReactionObserver
{
    public function created(Reaction $reaction): void
    {
        if ($reaction->user) {
            // Reaction toggle tạo row mới mỗi lần; max_per_day trong rule chặn farm điểm.
            PointService::award($reaction->user, 'reaction.created', $reaction);
        }
    }
}
