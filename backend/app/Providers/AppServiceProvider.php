<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
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

        // Register the broadcasting auth route with Sanctum so Bearer tokens
        // (used by the SPA) can authenticate private WebSocket channels.
        Broadcast::routes(['middleware' => ['auth:sanctum']]);
    }
}
