<?php

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'], // GET, POST, PUT, PATCH, DELETE, OPTIONS

    'allowed_origins' => [
        // Local development URLs
        env('ADMIN_FRONTEND_URL', 'http://localhost:5173'),
        env('USER_FRONTEND_URL', 'http://localhost:5174'),
        // Production URLs
        'https://ckc-it-club-website-admin.vercel.app',
        'https://ckc-it-club-website-user.vercel.app',
    ],

    'allowed_origins_patterns' => [
        // '/^https?:\/\/.*\.yourdomain\.com$/', // Allow all subdomains
    ],

    'allowed_headers' => ['*'],
    // Or specific headers:
    // ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept', 'Origin', 'Accept-Language'],

    'exposed_headers' => [
        'X-API-Version',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
    ],

    'max_age' => 600, // 10 minutes

    'supports_credentials' => true,
];
