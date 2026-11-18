<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\InventoryProduct;
use App\Models\MasterAppointment;
use App\Models\Service;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    /**
     * Dashboard statistics, financial analytics, OPD live queue, and clinical metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();
        $adminId = $admin?->id;
        $isStaffUser = ($admin instanceof Staff)
            || (isset($admin->role) && in_array(strtolower($admin->role), ['staff', 'staff practitioner']))
            || (isset($admin->user_type) && strtolower($admin->user_type) === 'staff')
            || ($admin && ! empty($admin->staff_code))
            || ($request->user() && $request->user()->tokenCan('role:staff'));

        // Activity log counts (strictly scoped to this staff member if logged in as staff)
        $myActivityCount = 0;
        $recentActivity = collect();
        if (Schema::hasTable('admin_activity_logs')) {
            if ($adminId) {
                $myActivityCount = AdminActivityLog::where('actor_type', $isStaffUser ? 'staff' : 'admin')
                    ->where('actor_id', $adminId)
                    ->count();
            }

            if ($isStaffUser && $adminId) {
                $recentActivity = AdminActivityLog::where('actor_type', 'staff')
                    ->where('actor_id', $adminId)
                    ->latest('id')
                    ->take(6)
                    ->get([
                        'id',
                        'action',
                        'description',
                        'ip_address',
                        'created_at',
                    ]);
            } else {
                $recentActivity = AdminActivityLog::latest('id')
                    ->take(8)
                    ->get([
                        'id',
                        'action',
                        'description',
                        'ip_address',
                        'created_at',
                    ]);
            }
        }

        // Account Details
        $accountDetails = [
            'name' => $admin?->name ?? ($isStaffUser ? 'Staff Practitioner' : 'Clinic Administrator'),
            'email' => $admin?->email ?? '',
            'staff_code' => $isStaffUser ? ($admin?->staff_code ?? '') : '',
            'department' => $isStaffUser ? ($admin?->department ?? '') : '',
            'designation' => $isStaffUser ? ($admin?->designation ?? '') : '',
            'role' => $isStaffUser ? 'Staff Practitioner' : 'Clinic Administrator',
            'is_staff' => $isStaffUser,
            'status' => ($admin && $admin->is_active) ? 'Active' : 'Inactive',
            'member_since' => ($admin && $admin->created_at) ? $admin->created_at->format('M d, Y') : '',
            'last_login' => ($admin && $admin->last_login_at) ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'Active session',
        ];

        $todayStr = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $clinicId = $admin?->clinic_id;

        // 1. Core Counts
        $totalCustomers = $isStaffUser ? 0 : Customer::count();
        $newCustomersThisMonth = $isStaffUser ? 0 : Customer::whereDate('created_at', '>=', $startOfMonth)->count();

        $masterQuery = MasterAppointment::query();
        if ($clinicId) {
            $masterQuery->where('clinic_id', $clinicId);
        }

        $totalMasterAppointments = $isStaffUser ? 0 : (clone $masterQuery)->count();
        $todayMasterAppointments = $isStaffUser ? 0 : (clone $masterQuery)->whereDate('appointment_date', $todayStr)->count();

        $sessionsQuery = AppointmentSession::whereHas('masterAppointment', function ($mq) use ($clinicId) {
            if ($clinicId) {
                $mq->where('clinic_id', $clinicId);
            }
        });
        if ($isStaffUser && $adminId) {
            $sessionsQuery->forStaff($adminId);
        }

        $totalSessions = (clone $sessionsQuery)->count();
        $todaySessionsCount = (clone $sessionsQuery)->whereDate('session_date', $todayStr)
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->count();

        // Session Status Counts
        $pendingSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_PENDING)->count();
        $inProgressSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $completedSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $cancelledSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_CANCELLED)->count();

        // Upcoming consultations
        $upcomingSessionsCount = (clone $sessionsQuery)->where('session_date', '>=', $todayStr)
            ->whereIn('status', [AppointmentSession::STATUS_PENDING, AppointmentSession::STATUS_IN_PROGRESS])
            ->count();

        $totalActionable = $completedSessions + $upcomingSessionsCount;
        $sessionCompletionRate = $totalActionable > 0 ? (int) round(($completedSessions / $totalActionable) * 100) : 0;

        // 2. Financial Metrics & Patient Collections
        if ($isStaffUser && $adminId) {
            $totalStaffCommission = (float) AppointmentSession::forStaff($adminId)
                ->where('status', AppointmentSession::STATUS_COMPLETED)
                ->sum('staff_commission');

            $todayStaffCommission = (float) AppointmentSession::forStaff($adminId)
                ->whereDate('session_date', $todayStr)
                ->where('status', AppointmentSession::STATUS_COMPLETED)
                ->sum('staff_commission');

            $todayRevenue = $todayStaffCommission;
            $totalRevenue = $totalStaffCommission;

            $totalPatientPaid = (float) AppointmentSession::forStaff($adminId)
                ->whereNotNull('payment_amount')
                ->sum('payment_amount');

            $todayPatientPaid = (float) AppointmentSession::forStaff($adminId)
                ->whereDate('payment_date', $todayStr)
                ->whereNotNull('payment_amount')
                ->sum('payment_amount');
        } else {
            $todayRevenue = (float) (clone $masterQuery)->whereDate('appointment_date', $todayStr)->sum('appointment_fees');
            $totalRevenue = (float) (clone $masterQuery)->sum('appointment_fees');

            $totalPatientPaid = (float) (clone $sessionsQuery)->whereNotNull('payment_amount')->sum('payment_amount');
            $todayPatientPaid = (float) (clone $sessionsQuery)->whereDate('payment_date', $todayStr)
                ->whereNotNull('payment_amount')
                ->sum('payment_amount');

            $totalStaffCommission = (float) (clone $sessionsQuery)->sum('staff_commission');
            $todayStaffCommission = (float) (clone $sessionsQuery)->whereDate('session_date', $todayStr)
                ->where('status', AppointmentSession::STATUS_COMPLETED)
                ->sum('staff_commission');
        }

        // Payment Modes Breakdown (Filtered for staff member if logged in as staff; clinic-wise for admin)
        $paymentModesQuery = AppointmentSession::whereHas('masterAppointment', function ($mq) use ($clinicId) {
            if ($clinicId) {
                $mq->where('clinic_id', $clinicId);
            }
        });
        if ($isStaffUser && $adminId) {
            $paymentModesQuery->forStaff($adminId);
        }

        $paymentModes = [
            'cash' => (float) (clone $paymentModesQuery)->where('payment_mode', 'cash')->sum('payment_amount'),
            'upi' => (float) (clone $paymentModesQuery)->where('payment_mode', 'upi')->sum('payment_amount'),
            'card' => (float) (clone $paymentModesQuery)->where('payment_mode', 'card')->sum('payment_amount'),
            'bank' => (float) (clone $paymentModesQuery)->where('payment_mode', 'bank')->sum('payment_amount'),
        ];

        // 3. Inventory & Medical Supplies Metrics
        $lowStockCount = 0;
        $lowStockProducts = collect();
        if (Schema::hasColumn('inventory_products', 'quantity')) {
            $lowStockQuery = InventoryProduct::where(function ($q) {
                $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->orWhere('quantity', '<=', 0);
            });
            if ($clinicId) {
                $lowStockQuery->where('clinic_id', $clinicId);
            }

            $lowStockProducts = $lowStockQuery
                ->orderBy('quantity', 'asc')
                ->take(5)
                ->get(['id', 'product_name', 'quantity', 'low_stock_threshold', 'business_unit', 'clinic_id']);

            $lowStockCountQuery = InventoryProduct::where(function ($q) {
                $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->orWhere('quantity', '<=', 0);
            });
            if ($clinicId) {
                $lowStockCountQuery->where('clinic_id', $clinicId);
            }
            $lowStockCount = $lowStockCountQuery->count();
        }

        $invProductsQuery = InventoryProduct::query();
        if ($clinicId) {
            $invProductsQuery->where('clinic_id', $clinicId);
        }
        $totalInventoryProducts = $invProductsQuery->count();

        // 4. Clinical Staff & Doctors on Duty Today (Hidden for staff members; strictly scoped to this admin's clinic)
        if ($isStaffUser) {
            $activeStaffCount = 1;
            $doctorsOnDuty = collect();
        } else {
            $staffQuery = Staff::where('status', 'active');
            if ($clinicId) {
                $staffQuery->where('clinic_id', $clinicId);
            }
            $activeStaffCount = $staffQuery->count();

            $dutyQuery = Staff::where('status', 'active');
            if ($clinicId) {
                $dutyQuery->where('clinic_id', $clinicId);
            }

            $doctorsOnDuty = $dutyQuery
                ->withCount(['appointmentSessions as today_sessions_count' => function ($q) use ($todayStr) {
                    $q->whereDate('session_date', $todayStr)
                        ->where('status', '!=', AppointmentSession::STATUS_CANCELLED);
                }])
                ->orderByDesc('today_sessions_count')
                ->take(6)
                ->get(['id', 'staff_code', 'name', 'department', 'designation', 'mobile', 'clinic_id']);
        }

        // 5. Active Clinical Services Catalog & Top Services (Scoped to this staff's sessions if staff)
        $activePackages = Service::count();
        if ($isStaffUser && $adminId) {
            $topServices = Service::whereHas('sessions', function ($q) use ($adminId) {
                $q->forStaff($adminId);
            })
                ->withCount(['sessions' => function ($q) use ($adminId) {
                    $q->forStaff($adminId);
                }])
                ->orderByDesc('sessions_count')
                ->take(4)
                ->get(['id', 'name', 'price']);
        } else {
            $topServices = Service::whereHas('sessions.masterAppointment', function ($mq) use ($clinicId) {
                if ($clinicId) {
                    $mq->where('clinic_id', $clinicId);
                }
            })
                ->withCount(['sessions' => function ($sq) use ($clinicId) {
                    if ($clinicId) {
                        $sq->whereHas('masterAppointment', fn ($mq) => $mq->where('clinic_id', $clinicId));
                    }
                }])
                ->orderByDesc('sessions_count')
                ->take(4)
                ->get(['id', 'name', 'price']);
        }

        // 6. Dynamic Real Revenue & Collections Trend Data for Interactive Chart
        $revenueDataByPeriod = $this->buildRevenueTrends($isStaffUser ? $adminId : null, $isStaffUser ? null : $clinicId);

        // 7. Recent Patient Registrations (Strictly hidden for staff members)
        $recentPatients = collect();
        if (! $isStaffUser) {
            $recentPatients = Customer::latest('id')
                ->take(6)
                ->get(['id', 'name', 'mobile', 'email', 'gender', 'age', 'created_at']);
        }

        // 8. Upcoming & Today's Clinical Schedule Feed (Filtered for staff member if staff; clinic-wise for admin)
        $scheduleSessionsQuery = AppointmentSession::with([
            'masterAppointment.customer:id,name,mobile,email,gender,age',
            'staff:id,staff_code,name,department',
            'service:id,name,price',
        ])
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->whereHas('masterAppointment', function ($mq) use ($clinicId) {
                if ($clinicId) {
                    $mq->where('clinic_id', $clinicId);
                }
            });

        if ($isStaffUser && $adminId) {
            $scheduleSessionsQuery->forStaff($adminId);
        }

        $scheduleSessions = $scheduleSessionsQuery
            ->orderByRaw("CASE WHEN session_date = '{$todayStr}' THEN 0 WHEN session_date > '{$todayStr}' THEN 1 ELSE 2 END ASC")
            ->orderBy('session_date', 'asc')
            ->orderBy('session_time', 'asc')
            ->take(8)
            ->get()
            ->map(function ($s) {
                $customer = $s->masterAppointment?->customer;
                $formattedTime = $s->session_time;
                try {
                    $formattedTime = Carbon::parse($s->session_time)->format('h:i A');
                } catch (\Throwable) {
                    // keep raw string
                }

                $formattedDate = $s->session_date;
                try {
                    $formattedDate = Carbon::parse($s->session_date)->format('M d, Y');
                } catch (\Throwable) {
                    // keep raw string
                }

                return [
                    'id' => $s->id,
                    'master_appointment_id' => $s->master_appointment_id,
                    'appointment_number' => $s->masterAppointment?->appointment_number ?? '',
                    'session_number' => $s->session_number,
                    'time' => $formattedTime,
                    'date' => $formattedDate,
                    'treatment_name' => $s->service?->name ?: ($s->treatment_details ?: 'Clinical Session'),
                    'patient_name' => $customer?->name ?? 'Walk-in Patient',
                    'patient_mobile' => $customer?->mobile ?? '',
                    'patient_gender' => $customer?->gender ?? '',
                    'patient_initial' => strtoupper(substr($customer?->name ?? 'PT', 0, 2)),
                    'doctor_name' => $s->staff?->name ?? 'Staff Practitioner',
                    'doctor_department' => $s->staff?->department ?? 'OPD Clinic',
                    'status' => $s->status,
                    'fee' => (float) ($s->service?->price ?? 0),
                    'payment_amount' => (float) ($s->payment_amount ?? 0),
                    'payment_mode' => $s->payment_mode ?? '',
                    'staff_commission' => (float) ($s->staff_commission ?? 0),
                ];
            });

        return response()->json([
            'stats' => [
                'total_customers' => $totalCustomers,
                'new_customers_this_month' => $newCustomersThisMonth,
                'total_appointments' => $totalMasterAppointments,
                'today_appointments' => $todayMasterAppointments,
                'total_sessions' => $totalSessions,
                'today_sessions' => $todaySessionsCount,
                'upcoming_appointments' => $upcomingSessionsCount,
                'pending_sessions' => $pendingSessions,
                'in_progress_sessions' => $inProgressSessions,
                'completed_sessions' => $completedSessions,
                'cancelled_sessions' => $cancelledSessions,
                'session_completion_rate' => $sessionCompletionRate,
                'today_revenue' => $todayRevenue,
                'total_revenue' => $totalRevenue,
                'today_patient_paid' => $todayPatientPaid,
                'total_patient_paid' => $totalPatientPaid,
                'today_staff_commission' => $todayStaffCommission,
                'total_staff_commission' => $totalStaffCommission,
                'active_packages' => $activePackages,
                'active_staff_count' => $activeStaffCount,
                'low_stock_count' => $lowStockCount,
                'total_inventory_products' => $totalInventoryProducts,
                'activity_count' => $myActivityCount,
                'account_status' => ($admin && $admin->is_active) ? 'Active' : 'Inactive',
                'last_login' => ($admin && $admin->last_login_at) ? Carbon::parse($admin->last_login_at)->diffForHumans() : 'Active session',
                'joined_days_ago' => ($admin && $admin->created_at) ? $admin->created_at->diffInDays(now()) : 0,
                'is_staff' => $isStaffUser,
            ],
            'account' => $accountDetails,
            'clinic' => $admin?->clinic ? [
                'id' => $admin->clinic->id,
                'clinic_code' => $admin->clinic->clinic_code,
                'name' => $admin->clinic->name,
                'branch_name' => $admin->clinic->branch_name,
                'location' => $admin->clinic->location,
                'address' => $admin->clinic->address,
                'city' => $admin->clinic->city,
                'state' => $admin->clinic->state,
                'postal_code' => $admin->clinic->postal_code,
                'phone' => $admin->clinic->phone,
                'email' => $admin->clinic->email,
                'status' => $admin->clinic->status,
            ] : null,
            'payment_modes' => $paymentModes,
            'revenue_chart' => $revenueDataByPeriod,
            'doctors_on_duty' => $doctorsOnDuty,
            'top_services' => $topServices,
            'low_stock_products' => $lowStockProducts,
            'recent_patients' => $recentPatients,
            'recent_activity' => $recentActivity,
            'schedule_sessions' => $scheduleSessions,
        ]);
    }

    /**
     * Compute real dynamic monthly, weekly, and quarterly trends for the interactive chart.
     */
    protected function buildRevenueTrends(?int $staffId = null, ?int $clinicId = null): array
    {
        $now = Carbon::now();

        // 1. Last 6 Months (Real Data)
        $last6Months = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonths($i);
            $start = $monthDate->copy()->startOfMonth()->toDateString();
            $end = $monthDate->copy()->endOfMonth()->toDateString();

            if ($staffId) {
                $commission = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$start, $end])
                    ->where('status', AppointmentSession::STATUS_COMPLETED)
                    ->sum('staff_commission');
                $collections = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$start, $end])
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $displayVal = $commission > 0 ? $commission : ($collections > 0 ? $collections : 0);
                $revenue = $commission;
            } else {
                $masterQ = MasterAppointment::whereBetween('appointment_date', [$start, $end]);
                $sessionQ = AppointmentSession::whereBetween('session_date', [$start, $end]);
                if ($clinicId) {
                    $masterQ->where('clinic_id', $clinicId);
                    $sessionQ->whereHas('masterAppointment', fn ($mq) => $mq->where('clinic_id', $clinicId));
                }
                $revenue = (float) $masterQ->sum('appointment_fees');
                $collections = (float) $sessionQ
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $displayVal = $revenue > 0 ? $revenue : ($collections > 0 ? $collections : 0);
            }

            $last6Months[] = [
                'label' => $monthDate->format('M'),
                'value' => $displayVal,
                'revenue' => $revenue,
                'collections' => $collections,
                'display' => '₹'.number_format($displayVal),
            ];
        }

        // 2. Last 30 Days (4 Weeks Real Data)
        $last30Days = [];
        for ($w = 3; $w >= 0; $w--) {
            $wStart = $now->copy()->subDays(($w + 1) * 7)->toDateString();
            $wEnd = $now->copy()->subDays($w * 7)->toDateString();

            if ($staffId) {
                $rev = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$wStart, $wEnd])
                    ->where('status', AppointmentSession::STATUS_COMPLETED)
                    ->sum('staff_commission');
                $col = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$wStart, $wEnd])
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $val = $rev > 0 ? $rev : $col;
            } else {
                $masterQ = MasterAppointment::whereBetween('appointment_date', [$wStart, $wEnd]);
                $sessionQ = AppointmentSession::whereBetween('session_date', [$wStart, $wEnd]);
                if ($clinicId) {
                    $masterQ->where('clinic_id', $clinicId);
                    $sessionQ->whereHas('masterAppointment', fn ($mq) => $mq->where('clinic_id', $clinicId));
                }
                $rev = (float) $masterQ->sum('appointment_fees');
                $col = (float) $sessionQ
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $val = $rev > 0 ? $rev : $col;
            }
            $weekNum = 4 - $w;

            $last30Days[] = [
                'label' => "Week {$weekNum}",
                'value' => $val,
                'revenue' => $rev,
                'collections' => $col,
                'display' => '₹'.number_format($val),
            ];
        }

        // 3. This Year (Quarterly Real Data)
        $thisYear = [];
        $quarters = [
            'Q1' => [1, 3],
            'Q2' => [4, 6],
            'Q3' => [7, 9],
            'Q4' => [10, 12],
        ];

        foreach ($quarters as $qName => [$startM, $endM]) {
            $qStart = Carbon::create($now->year, $startM, 1)->startOfMonth()->toDateString();
            $qEnd = Carbon::create($now->year, $endM, 1)->endOfMonth()->toDateString();

            if ($staffId) {
                $qRev = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$qStart, $qEnd])
                    ->where('status', AppointmentSession::STATUS_COMPLETED)
                    ->sum('staff_commission');
                $qCol = (float) AppointmentSession::forStaff($staffId)
                    ->whereBetween('session_date', [$qStart, $qEnd])
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $qVal = $qRev > 0 ? $qRev : $qCol;
            } else {
                $masterQ = MasterAppointment::whereBetween('appointment_date', [$qStart, $qEnd]);
                $sessionQ = AppointmentSession::whereBetween('session_date', [$qStart, $qEnd]);
                if ($clinicId) {
                    $masterQ->where('clinic_id', $clinicId);
                    $sessionQ->whereHas('masterAppointment', fn ($mq) => $mq->where('clinic_id', $clinicId));
                }
                $qRev = (float) $masterQ->sum('appointment_fees');
                $qCol = (float) $sessionQ
                    ->whereNotNull('payment_amount')
                    ->sum('payment_amount');
                $qVal = $qRev > 0 ? $qRev : $qCol;
            }

            $thisYear[] = [
                'label' => $qName,
                'value' => $qVal,
                'revenue' => $qRev,
                'collections' => $qCol,
                'display' => '₹'.number_format($qVal),
            ];
        }

        return [
            'Last 6 Months' => $last6Months,
            'Last 30 Days' => $last30Days,
            'This Year' => $thisYear,
        ];
    }
}
