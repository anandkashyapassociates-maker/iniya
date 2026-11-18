<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\Payout;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffPaymentController extends Controller
{
    /**
     * Resolve the authenticated Staff user.
     */
    protected function getStaffUser(Request $request): ?Staff
    {
        $user = $request->user();

        if ($user instanceof Staff) {
            return $user;
        }

        // Fallback for Admin testing or viewing a specific staff member
        if ($user && (! empty($user->is_super_admin) || (isset($user->role) && strtolower($user->role) === 'admin'))) {
            if ($staffId = $request->input('staff_id')) {
                return Staff::find($staffId);
            }
        }

        return null;
    }

    /**
     * Get paginated Payout vouchers and overall financial summary for the logged-in staff member.
     */
    public function index(Request $request): JsonResponse
    {
        $staff = $this->getStaffUser($request);

        if (! $staff) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $staffId = $staff->id;

        // Base query for staff payouts
        $query = Payout::where('staff_id', $staffId)
            ->where('payout_type', Payout::TYPE_STAFF)
            ->with([
                'staff:id,clinic_id,staff_code,name,department,designation,email,mobile',
                'staff.clinic:id,name,clinic_code,branch_name,location,city',
                'superAdmin:id,name,email',
            ]);

        // 1. Search keyword (voucher number, reference number, or note)
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('payout_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        // 2. Account type filter (Cash / Bank)
        if ($accountType = $request->input('account_type')) {
            if (in_array($accountType, [Payout::ACCOUNT_CASH, Payout::ACCOUNT_BANK], true)) {
                $query->where('account_type', $accountType);
            }
        }

        // 3. Status filter
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // 4. Date filtering / presets
        $preset = $request->input('preset', 'all_time');
        $today = Carbon::today();

        if ($preset === 'today') {
            $query->whereDate('payout_date', $today->toDateString());
        } elseif ($preset === 'this_month') {
            $query->whereBetween('payout_date', [$today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString()]);
        } elseif ($preset === 'last_30_days') {
            $query->whereBetween('payout_date', [$today->copy()->subDays(30)->toDateString(), $today->toDateString()]);
        } elseif ($preset === 'custom' || (! in_array($preset, ['all_time', 'today', 'this_month', 'last_30_days'], true) && ($request->input('from_date') || $request->input('to_date')))) {
            if ($fromDate = $request->input('from_date')) {
                $query->whereDate('payout_date', '>=', $fromDate);
            }
            if ($toDate = $request->input('to_date')) {
                $query->whereDate('payout_date', '<=', $toDate);
            }
        }

        // Calculate aggregate statistics for this staff member
        $baseStaffPayouts = Payout::where('staff_id', $staffId)->where('payout_type', Payout::TYPE_STAFF);

        $totalPayoutAmount = (float) (clone $baseStaffPayouts)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));
        $totalPaidAmount = (float) (clone $baseStaffPayouts)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalBalanceAmount = (float) (clone $baseStaffPayouts)->sum('balance_amount');
        $totalCashDisbursed = (float) (clone $baseStaffPayouts)->where('account_type', Payout::ACCOUNT_CASH)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalBankDisbursed = (float) (clone $baseStaffPayouts)->where('account_type', Payout::ACCOUNT_BANK)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalVouchersCount = (clone $baseStaffPayouts)->count();

        // Clinical session earnings (consultation fees / commissions)
        $staffSessions = AppointmentSession::where(function ($q) use ($staffId) {
            $q->where('executed_by_staff_id', $staffId)
                ->orWhere(function ($sq) use ($staffId) {
                    $sq->where('staff_id', $staffId)->whereNull('executed_by_staff_id');
                });
        });

        $totalSessionCommission = (float) (clone $staffSessions)
            ->where('status', AppointmentSession::STATUS_COMPLETED)
            ->sum(DB::raw('COALESCE(consultation_fee, staff_commission, 0)'));

        $completedSessionsCount = (clone $staffSessions)
            ->where('status', AppointmentSession::STATUS_COMPLETED)
            ->count();

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->orderBy('payout_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        $staff->loadMissing('clinic');

        return response()->json([
            'payouts' => $paginated,
            'summary' => [
                'total_payout_amount' => $totalPayoutAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_balance_amount' => $totalBalanceAmount,
                'total_cash_disbursed' => $totalCashDisbursed,
                'total_bank_disbursed' => $totalBankDisbursed,
                'total_vouchers_count' => $totalVouchersCount,
                'total_session_commission' => $totalSessionCommission,
                'completed_sessions_count' => $completedSessionsCount,
            ],
            'staff' => [
                'id' => $staff->id,
                'staff_code' => $staff->staff_code,
                'name' => $staff->name,
                'email' => $staff->email,
                'mobile' => $staff->mobile,
                'department' => $staff->department,
                'designation' => $staff->designation,
                'clinic' => $staff->clinic ? [
                    'id' => $staff->clinic->id,
                    'clinic_code' => $staff->clinic->clinic_code,
                    'name' => $staff->clinic->name,
                    'branch_name' => $staff->clinic->branch_name,
                    'location' => $staff->clinic->location,
                ] : null,
            ],
        ]);
    }

    /**
     * Get paginated Clinical Sessions earnings breakdown for the logged-in staff member.
     */
    public function sessionCommissions(Request $request): JsonResponse
    {
        $staff = $this->getStaffUser($request);

        if (! $staff) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $staffId = $staff->id;

        $query = AppointmentSession::where(function ($q) use ($staffId) {
            $q->where('executed_by_staff_id', $staffId)
                ->orWhere(function ($sq) use ($staffId) {
                    $sq->where('staff_id', $staffId)->whereNull('executed_by_staff_id');
                });
        })->with([
            'masterAppointment:id,appointment_number,appointment_date,customer_id,clinic_id',
            'masterAppointment.customer:id,name,mobile,email',
            'masterAppointment.clinic:id,name,branch_name,clinic_code',
            'service:id,name,price',
        ]);

        // Search
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('treatment_details', 'like', "%{$search}%")
                    ->orWhereHas('service', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('masterAppointment', function ($mq) use ($search) {
                        $mq->where('appointment_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%")
                                    ->orWhere('mobile', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // Status
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Date filter
        if ($date = $request->input('date')) {
            $today = Carbon::today()->toDateString();
            if ($date === 'today') {
                $query->whereDate('session_date', $today);
            } elseif ($date === 'this_month') {
                $query->whereBetween('session_date', [
                    Carbon::today()->startOfMonth()->toDateString(),
                    Carbon::today()->endOfMonth()->toDateString(),
                ]);
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                $query->whereDate('session_date', $date);
            }
        }

        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('session_date', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('session_date', '<=', $toDate);
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->orderBy('session_date', 'desc')
            ->orderBy('session_time', 'asc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json([
            'sessions' => $paginated,
        ]);
    }

    /**
     * Get single Payout voucher detail for the logged-in staff member.
     */
    public function voucher(Request $request, string|int $id): JsonResponse
    {
        $staff = $this->getStaffUser($request);

        if (! $staff) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $payout = Payout::with([
            'staff:id,clinic_id,staff_code,name,department,designation,email,mobile,address',
            'staff.clinic:id,name,clinic_code,branch_name,location,address,city,state,phone,email',
            'superAdmin:id,name,email',
        ])
            ->where('id', $id)
            ->where('staff_id', $staff->id)
            ->first();

        if (! $payout) {
            return response()->json([
                'message' => 'Payout voucher not found or access denied.',
            ], 404);
        }

        return response()->json([
            'payout' => $payout,
        ]);
    }
}
