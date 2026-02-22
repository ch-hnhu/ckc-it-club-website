<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class BaseApiController extends Controller
{
    use ApiResponse;

    /**
     * Items per page for pagination
     *
     * @var int
     */
    protected int $perPage = 15;

    /**
     * Constructor
     */
    public function __construct()
    {
        // Force JSON response
        request()->headers->set('Accept', 'application/json');
    }
}
