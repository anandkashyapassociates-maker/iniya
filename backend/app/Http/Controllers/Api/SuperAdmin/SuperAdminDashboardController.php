<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    /**
     * Get dashboard statistics and recent activity for Super Admin.
     */
    public function index(Request $request): JsonResponse
    {
        $totalAdmins = Admin::count();
        $activeAdmins = Admin::where('is_active', true)->count();
        $inactiveAdmins = Admin::where('is_active', false)->count();

        $recentAdmins = Admin::with('superAdmin:id,name,email')
            ->latest()
            ->take(5)
            ->get([
                'id',
                'super_admin_id',
                'name',
                'email',
                'is_active',
                'last_login_at',
                'created_at',
            ]);

        $recentActivity = AdminActivityLog::latest()
            ->take(8)
            ->get([
                'id',
                'actor_type',
                'actor_id',
                'action',
                'description',
                'ip_address',
                'created_at',
            ]);

        return response()->json([
            'stats' => [
                'total_admins' => $totalAdmins,
                'active_admins' => $activeAdmins,
                'inactive_admins' => $inactiveAdmins,
            ],
            'recent_admins' => $recentAdmins,
            'recent_activity' => $recentActivity,
        ]);
    }
}

