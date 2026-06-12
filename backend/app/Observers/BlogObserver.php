<?php

namespace App\Observers;

use App\Models\Blog;
use App\Services\PointService;

class BlogObserver
{
    public function created(Blog $blog): void
    {
        if ($blog->status === 'published') {
            $this->awardPublish($blog);
        }
    }

    public function updated(Blog $blog): void
    {
        // Chỉ cộng khi vừa chuyển trạng thái sang published.
        if ($blog->status === 'published' && $blog->wasChanged('status')) {
            $this->awardPublish($blog);
        }
    }

    private function awardPublish(Blog $blog): void
    {
        if ($blog->author) {
            // Dedup theo source (blog) đảm bảo mỗi blog chỉ cộng điểm 1 lần.
            PointService::award($blog->author, 'blog.published', $blog);
        }
    }
}
