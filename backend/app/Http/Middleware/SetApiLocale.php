<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
	/**
	 * Handle an incoming request.
	 *
	 * Automatically sets the application locale based on:
	 * 1. Accept-Language header
	 * 2. 'lang' query parameter
	 * 3. Falls back to default locale in config
	 *
	 * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
	 */
	public function handle(Request $request, Closure $next): Response
	{
		// Check for 'lang' query parameter first
		$locale = $request->query('lang');

		// If not in query, check Accept-Language header
		if (!$locale) {
			$locale = $request->header('Accept-Language');

			// Parse Accept-Language header (e.g., "vi-VN,vi;q=0.9,en;q=0.8")
			if ($locale) {
				$locale = substr($locale, 0, 2); // Get first 2 chars (vi, en, etc)
			}
		}

		// Validate locale and set if valid
		$availableLocales = ['en', 'vi']; // Add more as needed

		if ($locale && in_array($locale, $availableLocales)) {
			App::setLocale($locale);
		}

		return $next($request);
	}
}
