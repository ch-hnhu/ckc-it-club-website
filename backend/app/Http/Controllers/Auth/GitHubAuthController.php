<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;

class GitHubAuthController extends AuthBaseController
{
    public function redirectAdmin(?string $provider = null)
    {
        return parent::redirectAdmin('github');
    }

    public function redirectUser(?string $provider = null)
    {
        return parent::redirectUser('github');
    }

    public function callback(?string $provider = null, ?Request $request = null)
    {
        return parent::callback('github', request());
    }
}
