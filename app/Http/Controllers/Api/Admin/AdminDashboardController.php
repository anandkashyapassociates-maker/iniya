<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\InventoryProduct;
use App\Models\MasterAppointment;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

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
            'member_since' => $admin->created_at ? $admin->created_at->format('M d, Y') : '',
            'last_login' => $admin->last_login_at ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'First session',
        ];

        $todayStr = Carbon::today()->toDateString();

        // Core Counts
        $totalCustomers = Customer::count();
        $totalMasterAppointments = MasterAppointment::count();
        $todayMasterAppointments = MasterAppointment::whereDate('appointment_date', $todayStr)->count();

        $totalSessions = AppointmentSession::count();
        $todaySessionsCount = AppointmentSession::whereDate('session_date', $todayStr)
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->count();

        // Status Counts
        $pendingSessions = AppointmentSession::where('status', AppointmentSession::STATUS_PENDING)->count();
        $inProgressSessions = AppointmentSession::where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $completedSessions = AppointmentSession::where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $cancelledSessions = AppointmentSession::where('status', AppointmentSession::STATUS_CANCELLED)->count();

        // Upcoming sessions (today or future dates that are pending or in progress)
        $upcomingSessionsCount = AppointmentSession::where('session_date', '>=', $todayStr)
            ->whereIn('status', [AppointmentSession::STATUS_PENDING, AppointmentSession::STATUS_IN_PROGRESS])
            ->count();

        // Active treatment packages/services
        $activePackages = Service::count();

        // Revenue calculations
        $todayRevenue = (float) MasterAppointment::whereDate('appointment_date', $todayStr)->sum('appointment_fees');
        $totalRevenue = (float) MasterAppointment::sum('appointment_fees');

        // Inventory metrics
        $lowStockCount = 0;
        if (Schema::hasColumn('inventory_products', 'quantity')) {
            $lowStockCount = InventoryProduct::where(function ($q) {
                $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->orWhere('quantity', '<=', 0);
            })->count();
        }
        $totalInventoryProducts = InventoryProduct::count();

        // Recent / upcoming appointment sessions for the dashboard schedule table
        $scheduleSessions = AppointmentSession::with([
            'masterAppointment.customer',
            'staff',
            'service',
        ])
            ->where('session_date', '>=', $todayStr)
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->orderBy('session_date', 'asc')
            ->orderBy('session_time', 'asc')
            ->take(6)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'master_appointment_id' => $s->master_appointment_id,
                    'session_number' => $s->session_number,
                    'time' => Carbon::parse($s->session_time)->format('h:i A'),
                    'date' => $s->session_date,
                    'treatment_name' => $s->treatment_details ?: ($s->service?->service_name ?? 'Clinical Session'),
                    'patient_name' => $s->masterAppointment?->customer?->name ?? 'Patient',
                    'patient_initial' => strtoupper(substr($s->masterAppointment?->customer?->name ?? 'P', 0, 2)),
                    'doctor_name' => $s->staff?->name ?? 'Staff on Duty',
                    'status' => $s->status,
                    'fee' => (float) ($s->service?->price ?? 0),
                ];
            });

        return response()->json([
            'stats' => [
                'total_customers' => $totalCustomers,
                'total_appointments' => $totalMasterAppointments,
                'today_appointments' => $todayMasterAppointments,
                'total_sessions' => $totalSessions,
                'today_sessions' => $todaySessionsCount,
                'upcoming_appointments' => $upcomingSessionsCount,
                'pending_sessions' => $pendingSessions,
                'in_progress_sessions' => $inProgressSessions,
                'completed_sessions' => $completedSessions,
                'cancelled_sessions' => $cancelledSessions,
                'active_packages' => $activePackages,
                'today_revenue' => $todayRevenue,
                'total_revenue' => $totalRevenue,
                'low_stock_count' => $lowStockCount,
                'total_inventory_products' => $totalInventoryProducts,
                'activity_count' => $myActivityCount,
                'account_status' => $admin->is_active ? 'Active' : 'Inactive',
                'last_login' => $admin->last_login_at ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'First session',
                'joined_days_ago' => $admin->created_at ? $admin->created_at->diffInDays(now()) : 0,
            ],
            'account' => $accountDetails,
            'recent_activity' => $recentActivity,
            'schedule_sessions' => $scheduleSessions,
        ]);
    }
}
