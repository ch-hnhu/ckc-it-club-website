<?php

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'], // GET, POST, PUT, PATCH, DELETE, OPTIONS

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),   // Vite dev server
        // Add production URLs
        // 'https://yourdomain.com',
        // 'https://www.yourdomain.com',
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
