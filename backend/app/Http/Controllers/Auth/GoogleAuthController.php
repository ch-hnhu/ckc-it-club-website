<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;

class GoogleAuthController extends AuthBaseController
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectAdmin(?string $provider = null)
    {
        return parent::redirectAdmin('google');
    }

    /**
     * Handle Google OAuth callback
     */
    public function callback(?string $provider = null, ?Request $request = null)
    {
        return parent::callback('google', request());
    }

    /**
     * Redirect to Google OAuth
     */
    public function redirectUser(?string $provider = null)
    {
        return parent::redirectUser('google');
    }
}
