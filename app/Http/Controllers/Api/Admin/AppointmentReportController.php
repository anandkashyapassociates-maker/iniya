<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\MasterAppointment;
use App\Models\SalesMember;
use App\Models\Service;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentReportController extends Controller
{
    /**
     * Master Appointments-Wise Report with KPIs, filters, and session progress summary.
     */
    public function appointmentsReport(Request $request): JsonResponse
    {
        // Enforce staff isolation: Staff role cannot view clinic-wide master appointment reports
        $user = $request->user();
        if ($user instanceof Staff || (isset($user->role) && $user->role === 'staff')) {
            return response()->json([
                'success' => false,
                'message' => 'Staff members are not authorized to view clinic-wide appointment reports.',
            ], 403);
        }

        $query = MasterAppointment::with([
            'customer:id,name,mobile,email,gender,age,address,image',
            'salesTeam:id,sales_code,name,email,mobile,department',
            'admin:id,name,email',
            'sessions' => function ($q) {
                $q->with([
                    'staff:id,staff_code,name,department,designation',
                    'service:id,service_category_id,name,price',
                    'inventoryProduct:id,product_name,business_unit',
                ])->orderBy('session_number');
            },
        ]);

        // 1. Text Search Filter
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('appointment_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesTeam', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('sales_code', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sessions', function ($sesQ) use ($search) {
                        $sesQ->where('treatment_details', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Customer Filter
        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        // 3. Sales Team Filter
        if ($salesTeamId = $request->input('sales_team_id')) {
            $query->where('sales_team_id', $salesTeamId);
        }

        // 4. Staff Member Filter (Appointments containing sessions assigned to this staff)
        if ($staffId = $request->input('staff_id')) {
            $query->whereHas('sessions', function ($sq) use ($staffId) {
                $sq->where('staff_id', $staffId);
            });
        }

        // 5. Session Status Filter
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                if ($status === 'all_completed') {
                    // Appointments where all sessions are completed
                    $query->whereDoesntHave('sessions', function ($sq) {
                        $sq->where('status', '!=', AppointmentSession::STATUS_COMPLETED);
                    })->whereHas('sessions');
                } elseif (in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                    $query->whereHas('sessions', function ($sq) use ($status) {
                        $sq->where('status', $status);
                    });
                }
            }
        }

        // 6. Payment Status Filter
        if ($paymentStatus = $request->input('payment_status')) {
            if ($paymentStatus === 'paid') {
                $query->whereHas('sessions', function ($sq) {
                    $sq->whereNotNull('payment_amount')->where('payment_amount', '>', 0);
                });
            } elseif ($paymentStatus === 'unpaid') {
                $query->whereDoesntHave('sessions', function ($sq) {
                    $sq->whereNotNull('payment_amount')->where('payment_amount', '>', 0);
                });
            }
        }

        // 7. Date Presets & Range Filters
        $preset = $request->input('preset', 'all_time');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $this->applyDateFilter($query, 'appointment_date', $preset, $fromDate, $toDate);

        // Calculate KPI Summary on filtered master appointment records
        $summaryQuery = clone $query;
        $appointmentIds = $summaryQuery->pluck('id');

        $totalAppointments = $appointmentIds->count();
        $totalFees = (float) (clone $query)->sum('appointment_fees');

        // Aggregate session metrics for these appointments
        $sessionStats = AppointmentSession::whereIn('master_appointment_id', $appointmentIds)
            ->selectRaw('
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_sessions,
                SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress_sessions,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_sessions,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_sessions,
                SUM(COALESCE(payment_amount, 0)) as total_patient_paid,
                SUM(COALESCE(staff_commission, 0)) as total_staff_commission
            ')
            ->first();

        $summary = [
            'total_appointments' => $totalAppointments,
            'total_fees' => $totalFees,
            'total_sessions' => (int) ($sessionStats->total_sessions ?? 0),
            'completed_sessions' => (int) ($sessionStats->completed_sessions ?? 0),
            'in_progress_sessions' => (int) ($sessionStats->in_progress_sessions ?? 0),
            'pending_sessions' => (int) ($sessionStats->pending_sessions ?? 0),
            'cancelled_sessions' => (int) ($sessionStats->cancelled_sessions ?? 0),
            'total_patient_paid' => (float) ($sessionStats->total_patient_paid ?? 0),
            'total_staff_commission' => (float) ($sessionStats->total_staff_commission ?? 0),
        ];

        // Paginate results
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $paginated = $query->orderByDesc('appointment_date')
            ->orderByDesc('id')
            ->paginate($perPage);

        // Augment each master appointment with session summary counters
        $paginated->getCollection()->transform(function ($appointment) {
            $sessions = $appointment->sessions ?? collect();
            $totalCount = $sessions->count();
            $completedCount = $sessions->where('status', AppointmentSession::STATUS_COMPLETED)->count();
            $inProgressCount = $sessions->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
            $pendingCount = $sessions->where('status', AppointmentSession::STATUS_PENDING)->count();
            $cancelledCount = $sessions->where('status', AppointmentSession::STATUS_CANCELLED)->count();

            $totalPaid = (float) $sessions->sum('payment_amount');
            $totalCommission = (float) $sessions->sum('staff_commission');

            $overallStatus = 'pending';
            if ($totalCount > 0 && $completedCount === $totalCount) {
                $overallStatus = 'completed';
            } elseif ($inProgressCount > 0 || $completedCount > 0) {
                $overallStatus = 'in_progress';
            } elseif ($cancelledCount === $totalCount && $totalCount > 0) {
                $overallStatus = 'cancelled';
            }

            $appointment->session_stats = [
                'total' => $totalCount,
                'completed' => $completedCount,
                'in_progress' => $inProgressCount,
                'pending' => $pendingCount,
                'cancelled' => $cancelledCount,
                'overall_status' => $overallStatus,
                'total_paid' => $totalPaid,
                'total_commission' => $totalCommission,
            ];

            return $appointment;
        });

        return response()->json([
            'success' => true,
            'report' => $paginated,
            'summary' => $summary,
        ]);
    }

    /**
     * Session-Wise Report with KPIs, clinical services, staff assignments, and payments.
     */
    public function sessionsReport(Request $request): JsonResponse
    {
        // Enforce staff isolation: Staff role cannot view clinic-wide session reports
        $user = $request->user();
        if ($user instanceof Staff || (isset($user->role) && $user->role === 'staff')) {
            return response()->json([
                'success' => false,
                'message' => 'Staff members are not authorized to view clinic-wide session reports.',
            ], 403);
        }

        $query = AppointmentSession::with([
            'masterAppointment:id,appointment_number,customer_id,sales_team_id,appointment_date,appointment_fees,notes,image',
            'masterAppointment.customer:id,name,mobile,email,gender,age,address,image',
            'masterAppointment.salesTeam:id,sales_code,name,email,mobile,department',
            'staff:id,staff_code,name,department,designation,mobile',
            'service:id,service_category_id,name,price',
            'service.category:id,name',
            'inventoryProduct:id,product_name,business_unit',
        ]);

        // 1. Text Search Filter
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('treatment_details', 'like', "%{$search}%")
                    ->orWhere('payment_notes', 'like', "%{$search}%")
                    ->orWhere('payment_mode', 'like', "%{$search}%")
                    ->orWhere('session_number', 'like', "%{$search}%")
                    ->orWhereHas('masterAppointment', function ($mq) use ($search) {
                        $mq->where('appointment_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%")
                                    ->orWhere('mobile', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('staff', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('staff_code', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%");
                    })
                    ->orWhereHas('service', function ($servQ) use ($search) {
                        $servQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Staff Member Filter
        if ($staffId = $request->input('staff_id')) {
            $query->where('staff_id', $staffId);
        }

        // 3. Service Filter
        if ($serviceId = $request->input('service_id')) {
            $query->where('service_id', $serviceId);
        }

        // 4. Customer Filter
        if ($customerId = $request->input('customer_id')) {
            $query->whereHas('masterAppointment', function ($mq) use ($customerId) {
                $mq->where('customer_id', $customerId);
            });
        }

        // 5. Sales Member Filter
        if ($salesTeamId = $request->input('sales_team_id')) {
            $query->whereHas('masterAppointment', function ($mq) use ($salesTeamId) {
                $mq->where('sales_team_id', $salesTeamId);
            });
        }

        // 6. Session Status Filter
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        // 7. Payment Status / Channel Filter
        if ($paymentStatus = $request->input('payment_status')) {
            if ($paymentStatus === 'paid') {
                $query->whereNotNull('payment_amount')->where('payment_amount', '>', 0);
            } elseif ($paymentStatus === 'unpaid') {
                $query->where(function ($q) {
                    $q->whereNull('payment_amount')->orWhere('payment_amount', '<=', 0);
                });
            } elseif (in_array($paymentStatus, ['cash', 'upi', 'card', 'bank'], true)) {
                $query->where('payment_mode', $paymentStatus);
            }
        }

        // 8. Date Presets & Range Filters on session_date
        $preset = $request->input('preset', 'all_time');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $this->applyDateFilter($query, 'session_date', $preset, $fromDate, $toDate);

        // Calculate KPI Summary on filtered sessions
        $summaryStats = (clone $query)
            ->selectRaw('
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_sessions,
                SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress_sessions,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_sessions,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_sessions,
                SUM(COALESCE(payment_amount, 0)) as total_patient_paid,
                SUM(COALESCE(staff_commission, 0)) as total_staff_commission
            ')
            ->first();

        $summary = [
            'total_sessions' => (int) ($summaryStats->total_sessions ?? 0),
            'completed_sessions' => (int) ($summaryStats->completed_sessions ?? 0),
            'in_progress_sessions' => (int) ($summaryStats->in_progress_sessions ?? 0),
            'pending_sessions' => (int) ($summaryStats->pending_sessions ?? 0),
            'cancelled_sessions' => (int) ($summaryStats->cancelled_sessions ?? 0),
            'total_patient_paid' => (float) ($summaryStats->total_patient_paid ?? 0),
            'total_staff_commission' => (float) ($summaryStats->total_staff_commission ?? 0),
        ];

        // Paginate results
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $paginated = $query->orderByDesc('session_date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'report' => $paginated,
            'summary' => $summary,
        ]);
    }

    /**
     * Dropdown filter options for reports (Staff, Sales Members, Services, Customers, Statuses).
     */
    public function filterOptions(): JsonResponse
    {
        $staff = Staff::where('status', 'active')
            ->select('id', 'name', 'staff_code', 'department', 'designation')
            ->orderBy('name')
            ->get();

        $salesTeam = SalesMember::where('status', 'active')
            ->select('id', 'name', 'sales_code', 'department')
            ->orderBy('name')
            ->get();

        $services = Service::select('id', 'service_category_id', 'name', 'price')
            ->orderBy('name')
            ->get();

        $customers = Customer::select('id', 'name', 'mobile')
            ->orderBy('name')
            ->limit(100)
            ->get();

        $statuses = [
            ['id' => 'all', 'label' => 'All Statuses'],
            ['id' => 'pending', 'label' => 'Pending'],
            ['id' => 'in_progress', 'label' => 'In Progress'],
            ['id' => 'completed', 'label' => 'Completed / Closed'],
            ['id' => 'cancelled', 'label' => 'Cancelled'],
        ];

        $paymentStatuses = [
            ['id' => 'all', 'label' => 'All Payments'],
            ['id' => 'paid', 'label' => 'Payment Received'],
            ['id' => 'unpaid', 'label' => 'Payment Pending / Unpaid'],
            ['id' => 'cash', 'label' => 'Cash Mode'],
            ['id' => 'upi', 'label' => 'UPI / QR Mode'],
            ['id' => 'card', 'label' => 'Card Mode'],
            ['id' => 'bank', 'label' => 'Bank Transfer Mode'],
        ];

        return response()->json([
            'success' => true,
            'staff' => $staff,
            'sales_team' => $salesTeam,
            'services' => $services,
            'customers' => $customers,
            'statuses' => $statuses,
            'payment_statuses' => $paymentStatuses,
        ]);
    }

    /**
     * Helper to apply flexible date presets and custom ranges to any column.
     */
    protected function applyDateFilter($query, string $dateColumn, ?string $preset, ?string $fromDate, ?string $toDate): void
    {
        $now = Carbon::now();

        if ($preset && $preset !== 'all_time' && $preset !== 'custom') {
            match ($preset) {
                'today' => $query->whereDate($dateColumn, $now->toDateString()),
                'yesterday' => $query->whereDate($dateColumn, $now->copy()->subDay()->toDateString()),
                'this_week' => $query->whereDate($dateColumn, '>=', $now->copy()->startOfWeek()->toDateString())
                    ->whereDate($dateColumn, '<=', $now->copy()->endOfWeek()->toDateString()),
                'last_7_days' => $query->whereDate($dateColumn, '>=', $now->copy()->subDays(6)->toDateString()),
                'this_month' => $query->whereDate($dateColumn, '>=', $now->copy()->startOfMonth()->toDateString())
                    ->whereDate($dateColumn, '<=', $now->copy()->endOfMonth()->toDateString()),
                'last_month' => $query->whereDate($dateColumn, '>=', $now->copy()->subMonth()->startOfMonth()->toDateString())
                    ->whereDate($dateColumn, '<=', $now->copy()->subMonth()->endOfMonth()->toDateString()),
                'last_30_days' => $query->whereDate($dateColumn, '>=', $now->copy()->subDays(29)->toDateString()),
                default => null,
            };
        } else {
            if ($fromDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fromDate)) {
                $query->whereDate($dateColumn, '>=', $fromDate);
            }
            if ($toDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $toDate)) {
                $query->whereDate($dateColumn, '<=', $toDate);
            }
        }
    }
}
