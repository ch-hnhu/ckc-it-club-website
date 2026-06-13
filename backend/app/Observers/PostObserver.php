<?php

namespace App\Observers;

use App\Models\Post;
use App\Services\PointService;

class PostObserver
{
    public function created(Post $post): void
    {
        if ($post->status === 'published') {
            $this->awardPublish($post);
        }
    }

    public function updated(Post $post): void
    {
        if ($post->status === 'published' && $post->wasChanged('status')) {
            $this->awardPublish($post);
        }
    }

    private function awardPublish(Post $post): void
    {
        if ($post->user) {
            PointService::award($post->user, 'post.published', $post);
        }
    }
}
