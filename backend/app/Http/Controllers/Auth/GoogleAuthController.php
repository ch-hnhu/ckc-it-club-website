<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;

class GoogleAuthController extends AuthBaseController
{
    /**
     * Redirect to Google OAuth
     */
    public function redirect(?string $provider = null)
    {
        return parent::redirect('google');
    }

    /**
     * Handle Google OAuth callback
     */
    public function callback(?string $provider = null, ?Request $request = null)
    {
        return parent::callback('google', request());
    }
}
