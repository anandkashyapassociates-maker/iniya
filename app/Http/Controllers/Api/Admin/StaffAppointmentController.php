<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\MasterAppointment;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAppointmentController extends Controller
{
    /**
     * List appointments assigned to the logged-in staff member.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! ($user instanceof Staff)) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $staffId = $user->id;

        $query = MasterAppointment::whereHas('sessions', function ($q) use ($staffId) {
            $q->where('staff_id', $staffId);
        })->with([
            'customer:id,customer_code,name,email,mobile,age,gender,opd_number',
            'salesTeam:id,sales_code,name',
            'sessions' => function ($q) {
                $q->with([
                    'staff:id,staff_code,name,department,designation',
                    'inventoryProduct:id,product_name,business_unit',
                    'service:id,name,price',
                ])->orderBy('session_number');
            },
        ]);

        // 1. Search keyword
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('appointment_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('customer_code', 'like', "%{$search}%")
                            ->orWhere('opd_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sessions', function ($sq) use ($search) {
                        $sq->where('treatment_details', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Date Filtering
        $today = Carbon::today()->toDateString();
        $dateFilter = $request->input('date');

        if ($dateFilter === 'today') {
            $query->where(function ($q) use ($today, $staffId) {
                $q->whereDate('appointment_date', $today)
                    ->orWhereHas('sessions', function ($sq) use ($today, $staffId) {
                        $sq->where('staff_id', $staffId)->whereDate('session_date', $today);
                    });
            });
        } elseif ($dateFilter === 'upcoming') {
            $query->where(function ($q) use ($today, $staffId) {
                $q->whereDate('appointment_date', '>=', $today)
                    ->orWhereHas('sessions', function ($sq) use ($today, $staffId) {
                        $sq->where('staff_id', $staffId)->whereDate('session_date', '>=', $today);
                    });
            });
        } elseif ($dateFilter === 'past') {
            $query->where(function ($q) use ($today, $staffId) {
                $q->whereDate('appointment_date', '<', $today)
                    ->orWhereHas('sessions', function ($sq) use ($today, $staffId) {
                        $sq->where('staff_id', $staffId)->whereDate('session_date', '<', $today);
                    });
            });
        } elseif ($dateFilter && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
            $query->where(function ($q) use ($dateFilter, $staffId) {
                $q->whereDate('appointment_date', $dateFilter)
                    ->orWhereHas('sessions', function ($sq) use ($dateFilter, $staffId) {
                        $sq->where('staff_id', $staffId)->whereDate('session_date', $dateFilter);
                    });
            });
        }

        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('appointment_date', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('appointment_date', '<=', $toDate);
        }

        // 3. Status Filtering
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                $query->whereHas('sessions', function ($sq) use ($status, $staffId) {
                    $sq->where('staff_id', $staffId)->where('status', $status);
                });
            }
        }

        // Statistics for logged-in staff member
        $staffSessions = AppointmentSession::where('staff_id', $staffId);
        $totalSessionsCount = (clone $staffSessions)->count();
        $todaySessionsCount = (clone $staffSessions)->whereDate('session_date', $today)->count();
        $pendingSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_PENDING)->count();
        $completedSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $inProgressSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $totalCommissionEarned = (float) (clone $staffSessions)->sum('staff_commission');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->orderBy('appointment_date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'appointments' => $paginated,
            'summary' => [
                'total_appointments' => $paginated->total(),
                'total_sessions' => $totalSessionsCount,
                'today_sessions' => $todaySessionsCount,
                'pending_sessions' => $pendingSessionsCount,
                'completed_sessions' => $completedSessionsCount,
                'in_progress_sessions' => $inProgressSessionsCount,
                'total_commission_earned' => $totalCommissionEarned,
            ],
        ]);
    }

    /**
     * Show single appointment details for the staff member.
     */
    public function show(Request $request, string|int $id): JsonResponse
    {
        $user = $request->user();

        if (! ($user instanceof Staff)) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $staffId = $user->id;

        $appointment = MasterAppointment::with([
            'customer',
            'salesTeam:id,sales_code,name,department,mobile',
            'admin:id,name,email',
            'sessions' => function ($q) {
                $q->with([
                    'staff:id,staff_code,name,department,designation,mobile',
                    'service:id,service_category_id,name,price',
                    'service.category:id,parent_id,name',
                    'inventoryProduct:id,product_name,business_unit',
                    'rescheduleHistories',
                ])->orderBy('session_number');
            },
        ])->find($id);

        if (! $appointment) {
            return response()->json([
                'message' => 'Appointment record not found.',
            ], 404);
        }

        // Verify this staff member is assigned to at least one session in this appointment
        $isAssigned = $appointment->sessions->contains('staff_id', $staffId);
        if (! $isAssigned) {
            return response()->json([
                'message' => 'Unauthorized. You are not assigned to this appointment.',
            ], 403);
        }

        return response()->json([
            'appointment' => $appointment,
        ]);
    }
}
