<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\MasterAppointment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * Dashboard statistics and relevant activity for the authenticated Admin.
     */
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();

        // Count personal activity
        $myActivityCount = AdminActivityLog::where('actor_type', 'admin')
            ->where('actor_id', $admin->id)
            ->count();

        // Recent activity relevant to this admin
        $recentActivity = AdminActivityLog::where('actor_type', 'admin')
            ->where('actor_id', $admin->id)
            ->latest()
            ->take(8)
            ->get([
                'id',
                'action',
                'description',
                'ip_address',
                'created_at',
            ]);

        // Account status info
        $accountDetails = [
            'name' => $admin->name,
            'email' => $admin->email,
            'status' => $admin->is_active ? 'Active' : 'Inactive',
            'member_since' => $admin->created_at->format('M d, Y'),
            'last_login' => $admin->last_login_at ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'First session',
        ];

        $totalCustomers = Customer::count();
        $totalAppointments = MasterAppointment::count();
        $todayAppointments = MasterAppointment::whereDate('appointment_date', Carbon::today()->toDateString())->count();
        $totalSessions = AppointmentSession::count();
        $todaySessions = AppointmentSession::whereDate('session_date', Carbon::today()->toDateString())
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->count();
        $lowStockCount = InventoryProduct::where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', '<=', 0);
        })->count();
        $totalInventoryProducts = InventoryProduct::count();

        return response()->json([
            'stats' => [
                'total_customers' => $totalCustomers,
                'total_appointments' => $totalAppointments,
                'today_appointments' => $todayAppointments,
                'total_sessions' => $totalSessions,
                'today_sessions' => $todaySessions,
                'activity_count' => $myActivityCount,
                'account_status' => $admin->is_active ? 'Active' : 'Inactive',
                'last_login' => $admin->last_login_at ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'First session',
                'joined_days_ago' => $admin->created_at->diffInDays(now()),
            ],
            'account' => $accountDetails,
            'recent_activity' => $recentActivity,
        ]);
    }
}
