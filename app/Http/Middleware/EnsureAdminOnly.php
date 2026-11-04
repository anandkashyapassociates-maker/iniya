<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Staff;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOnly
{
    /**
     * Handle an incoming request.
     * Strictly verifies that the user is an Administrator.
     * Staff members attempting to access or modify Admin-only resources receive 403 Forbidden.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $isStaff = ($user instanceof Staff)
            || (isset($user->role) && in_array(strtolower($user->role), ['staff', 'staff practitioner']))
            || (isset($user->user_type) && strtolower($user->user_type) === 'staff')
            || ($user && ! empty($user->staff_code))
            || ($user && $user->tokenCan('role:staff'));

        if ($isStaff || ! ($user instanceof Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Administrative privileges required for this section.',
            ], 403);
        }

        return $next($request);
    }
}
