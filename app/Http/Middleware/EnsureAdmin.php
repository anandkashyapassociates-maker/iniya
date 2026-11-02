<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Staff;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (! ($user instanceof Admin || $user instanceof Staff)) {
            return response()->json([
                'message' => 'Access denied. Admin or Staff privileges required.',
            ], 403);
        }

        if ($user->status === 'blocked') {
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            $userType = ($user instanceof Staff) ? 'Staff' : 'Admin';

            return response()->json([
                'message' => "Your {$userType} account has been blocked by the Super Administrator. Access denied.",
            ], 403);
        }

        if (! $user->is_active || $user->status === 'inactive') {
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            $contactTarget = ($user instanceof Staff) ? 'administrator' : 'Super Admin';
            $userType = ($user instanceof Staff) ? 'Staff' : 'Admin';

            return response()->json([
                'message' => "Your {$userType} account has been deactivated. Please contact the {$contactTarget}.",
            ], 403);
        }

        return $next($request);
    }
}
