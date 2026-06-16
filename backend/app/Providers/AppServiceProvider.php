<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\Comment;
use App\Models\EventCheckIn;
use App\Models\Post;
use App\Models\Reaction;
use App\Observers\BlogObserver;
use App\Observers\CommentObserver;
use App\Observers\EventCheckInObserver;
use App\Observers\PostObserver;
use App\Observers\ReactionObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        // Gamification — cộng điểm tự động qua PointService khi có hành động thật.
        Blog::observe(BlogObserver::class);
        Post::observe(PostObserver::class);
        Comment::observe(CommentObserver::class);
        Reaction::observe(ReactionObserver::class);
        EventCheckIn::observe(EventCheckInObserver::class);
    }
}
