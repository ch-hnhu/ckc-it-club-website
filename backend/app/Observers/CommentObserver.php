<?php

namespace App\Observers;

use App\Models\Comment;
use App\Services\PointService;

class CommentObserver
{
    public function created(Comment $comment): void
    {
        if ($comment->user) {
            // Mỗi comment là một source riêng; max_per_day trong rule chặn spam.
            PointService::award($comment->user, 'comment.created', $comment);
        }
    }
}
