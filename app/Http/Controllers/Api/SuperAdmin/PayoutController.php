<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Payout;
use App\Models\Staff;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayoutController extends Controller
{
    /**
     * Overall Payout KPIs & Statistics for Super Admin.
     */
    public function stats(): JsonResponse
    {
        $all = Payout::all();

        $totalDisbursed = (float) $all->sum('amount');
        $totalPayoutAmount = (float) $all->sum(fn ($p) => (float) ($p->total_amount > 0 ? $p->total_amount : $p->amount));
        $totalPaidAmount = (float) $all->sum(fn ($p) => (float) ($p->paid_amount > 0 ? $p->paid_amount : $p->amount));
        $totalBalanceAmount = (float) $all->sum(fn ($p) => (float) $p->balance_amount);
        $totalCount = $all->count();

        $staffPayouts = $all->where('payout_type', Payout::TYPE_STAFF);
        $vendorPayouts = $all->where('payout_type', Payout::TYPE_VENDOR);

        $cashPayouts = $all->where('account_type', Payout::ACCOUNT_CASH);
        $bankPayouts = $all->where('account_type', Payout::ACCOUNT_BANK);

        return response()->json([
            'total_disbursed' => $totalDisbursed,
            'total_payout_amount' => $totalPayoutAmount,
            'total_paid_amount' => $totalPaidAmount,
            'total_balance_amount' => $totalBalanceAmount,
            'total_count' => $totalCount,
            'staff_payouts_amount' => (float) $staffPayouts->sum('amount'),
            'staff_payouts_count' => $staffPayouts->count(),
            'vendor_payouts_amount' => (float) $vendorPayouts->sum('amount'),
            'vendor_payouts_count' => $vendorPayouts->count(),
            'cash_total_amount' => (float) $cashPayouts->sum('amount'),
            'cash_total_count' => $cashPayouts->count(),
            'bank_total_amount' => (float) $bankPayouts->sum('amount'),
            'bank_total_count' => $bankPayouts->count(),
        ]);
    }

    /**
     * Active Staff list for selection dropdown.
     */
    public function staffOptions(): JsonResponse
    {
        $staff = Staff::select(['id', 'staff_code', 'name', 'department', 'designation', 'mobile', 'email', 'status', 'is_active'])
            ->where('status', '!=', Staff::STATUS_BLOCKED)
            ->orderBy('name', 'asc')
            ->get();

        // Calculate commissions & payouts for each staff member
        $commissions = AppointmentSession::select('staff_id', DB::raw('SUM(staff_commission) as total_commission'))
            ->whereNotNull('staff_id')
            ->groupBy('staff_id')
            ->pluck('total_commission', 'staff_id');

        $payouts = Payout::where('payout_type', Payout::TYPE_STAFF)
            ->select('staff_id', DB::raw('SUM(paid_amount) as total_paid'))
            ->groupBy('staff_id')
            ->pluck('total_paid', 'staff_id');

        $staff->each(function ($s) use ($commissions, $payouts) {
            $totalComm = (float) ($commissions[$s->id] ?? 0);
            $totalPaid = (float) ($payouts[$s->id] ?? 0);
            $s->total_commission = $totalComm;
            $s->total_paid = $totalPaid;
            $s->pending_balance = max(0.00, round($totalComm - $totalPaid, 2));
        });

        return response()->json($staff);
    }

    /**
     * Active Vendors list for selection dropdown.
     */
    public function vendorOptions(): JsonResponse
    {
        $vendors = Vendor::select(['id', 'vendor_code', 'vendor_name', 'company_name', 'mobile', 'email', 'status'])
            ->where('status', '!=', Vendor::STATUS_BLOCKED)
            ->orderBy('vendor_name', 'asc')
            ->get();

        return response()->json($vendors);
    }

    /**
     * List Staff Payouts with search, filters, pagination, and summary.
     */
    public function staffPayouts(Request $request): JsonResponse
    {
        $query = Payout::with([
            'staff:id,staff_code,name,department,designation,email,mobile',
            'superAdmin:id,name,email',
        ])->where('payout_type', Payout::TYPE_STAFF);

        // Search by payout_number, staff name, staff_code, note, or reference_number
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payout_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%")
                    ->orWhereHas('staff', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('staff_code', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Staff ID
        if ($staffId = $request->input('staff_id')) {
            if ($staffId !== 'all' && $staffId !== '') {
                $query->where('staff_id', $staffId);
            }
        }

        // Filter by Account Type (Cash, Bank)
        if ($accountType = $request->input('account_type')) {
            if ($accountType !== 'all' && $accountType !== '') {
                $query->where('account_type', $accountType);
            }
        }

        // Date range filter
        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('payout_date', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('payout_date', '<=', $toDate);
        }

        // Calculate summary on filtered query before pagination
        $summaryQuery = clone $query;
        $totalAmount = (float) $summaryQuery->sum('amount');

        // Commissions from appointment_sessions
        $selectedStaffId = $request->input('staff_id');
        if ($selectedStaffId && $selectedStaffId !== 'all') {
            $commissionsSum = (float) AppointmentSession::where('staff_id', $selectedStaffId)->sum('staff_commission');
        } else {
            $commissionsSum = (float) AppointmentSession::whereNotNull('staff_id')->sum('staff_commission');
        }

        $totalPayoutAmount = $commissionsSum > 0
            ? $commissionsSum
            : (float) (clone $query)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));

        $totalPaidAmount = (float) (clone $query)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalBalanceAmount = max(0.00, round($totalPayoutAmount - $totalPaidAmount, 2));

        $cashAmount = (float) (clone $query)->where('account_type', Payout::ACCOUNT_CASH)->sum('amount');
        $bankAmount = (float) (clone $query)->where('account_type', Payout::ACCOUNT_BANK)->sum('amount');
        $totalCount = $summaryQuery->count();

        // Sorting
        $sortBy = $request->input('sort_by', 'payout_date');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, ['id', 'payout_number', 'amount', 'payout_date', 'account_type', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');
        } else {
            $query->orderBy('payout_date', 'desc')->orderBy('id', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->paginate($perPage);

        // Dynamically enrich payout items with staff commission data from appointment_sessions if total_amount was not pre-populated
        $staffIds = collect($paginated->items())->pluck('staff_id')->filter()->unique();
        if ($staffIds->isNotEmpty()) {
            $commissionsByStaff = AppointmentSession::whereIn('staff_id', $staffIds)
                ->select('staff_id', DB::raw('SUM(staff_commission) as total_comm'))
                ->groupBy('staff_id')
                ->pluck('total_comm', 'staff_id');

            foreach ($paginated->items() as $item) {
                if ($item->staff_id && isset($commissionsByStaff[$item->staff_id])) {
                    $staffComm = (float) $commissionsByStaff[$item->staff_id];
                    if ($staffComm > 0 && ((float) $item->total_amount <= 0 || (float) $item->total_amount < (float) $item->paid_amount)) {
                        $item->total_amount = $staffComm;
                        $item->balance_amount = max(0.00, round($staffComm - (float) $item->paid_amount, 2));
                    }
                }
            }
        }

        return response()->json([
            'payouts' => $paginated,
            'summary' => [
                'total_amount' => $totalAmount,
                'total_payout_amount' => $totalPayoutAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_balance_amount' => $totalBalanceAmount,
                'total_count' => $totalCount,
                'cash_amount' => $cashAmount,
                'bank_amount' => $bankAmount,
            ],
        ]);
    }

    /**
     * Store a new Staff Payout.
     */
    public function storeStaffPayout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_id' => ['required', 'exists:staff,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payout_date' => ['required', 'date'],
            'account_type' => ['required', 'string', 'in:Cash,Bank'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $superAdmin = $request->user();
        $staff = Staff::findOrFail($validated['staff_id']);

        $payoutNumber = Payout::generateUniqueNumber(Payout::TYPE_STAFF);

        $paidAmount = (float) $validated['amount'];

        // Automatically pull total commission earned from appointment_sessions
        $totalCommission = (float) AppointmentSession::where('staff_id', $staff->id)->sum('staff_commission');

        // Sum previously paid disbursements to this staff member
        $previouslyPaid = (float) Payout::where('payout_type', Payout::TYPE_STAFF)
            ->where('staff_id', $staff->id)
            ->sum('paid_amount');

        // Total Payout amount is the staff member's total commission from appointment_sessions
        $totalAmount = $totalCommission > 0 ? $totalCommission : (float) ($request->input('total_amount') ?? $paidAmount);

        $cumulativePaid = $previouslyPaid + $paidAmount;
        $balanceAmount = max(0.00, round($totalAmount - $cumulativePaid, 2));

        $status = Payout::STATUS_COMPLETED;
        if ($balanceAmount > 0 && $paidAmount > 0) {
            $status = Payout::STATUS_PARTIAL;
        } elseif ($paidAmount <= 0) {
            $status = Payout::STATUS_PENDING;
        }

        $payout = Payout::create([
            'payout_number' => $payoutNumber,
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'vendor_id' => null,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'amount' => $paidAmount,
            'payout_date' => $validated['payout_date'],
            'account_type' => $validated['account_type'],
            'reference_number' => $validated['reference_number'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => $status,
            'created_by_superadmin_id' => $superAdmin->id,
        ]);

        $payout->load([
            'staff:id,staff_code,name,department,designation,email,mobile',
            'superAdmin:id,name,email',
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_payout_recorded',
            "Disbursed Staff Payout of ₹{$payout->amount} via {$payout->account_type} to '{$staff->name}' ({$staff->staff_code}) - Voucher: {$payout->payout_number}.",
            $request
        );

        return response()->json([
            'message' => 'Staff payout recorded successfully.',
            'payout' => $payout,
        ], 201);
    }

    /**
     * Update an existing Staff Payout.
     */
    public function updateStaffPayout(Request $request, string $id): JsonResponse
    {
        $payout = Payout::where('payout_type', Payout::TYPE_STAFF)->findOrFail($id);

        $validated = $request->validate([
            'staff_id' => ['required', 'exists:staff,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payout_date' => ['required', 'date'],
            'account_type' => ['required', 'string', 'in:Cash,Bank'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $superAdmin = $request->user();
        $staff = Staff::findOrFail($validated['staff_id']);

        $paidAmount = (float) $validated['amount'];

        // Automatically pull total commission earned from appointment_sessions
        $totalCommission = (float) AppointmentSession::where('staff_id', $staff->id)->sum('staff_commission');

        // Sum previously paid disbursements to this staff member (excluding this payout itself)
        $previouslyPaid = (float) Payout::where('payout_type', Payout::TYPE_STAFF)
            ->where('staff_id', $staff->id)
            ->where('id', '!=', $payout->id)
            ->sum('paid_amount');

        // Total Payout amount is the staff member's total commission from appointment_sessions
        $totalAmount = $totalCommission > 0 ? $totalCommission : (float) ($request->input('total_amount') ?? $paidAmount);

        $cumulativePaid = $previouslyPaid + $paidAmount;
        $balanceAmount = max(0.00, round($totalAmount - $cumulativePaid, 2));

        $status = Payout::STATUS_COMPLETED;
        if ($balanceAmount > 0 && $paidAmount > 0) {
            $status = Payout::STATUS_PARTIAL;
        } elseif ($paidAmount <= 0) {
            $status = Payout::STATUS_PENDING;
        }

        $payout->update([
            'staff_id' => $staff->id,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'amount' => $paidAmount,
            'payout_date' => $validated['payout_date'],
            'account_type' => $validated['account_type'],
            'reference_number' => $validated['reference_number'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => $status,
        ]);

        $payout->load([
            'staff:id,staff_code,name,department,designation,email,mobile',
            'superAdmin:id,name,email',
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_payout_updated',
            "Updated Staff Payout voucher '{$payout->payout_number}' for '{$staff->name}' ({$staff->staff_code}) - ₹{$payout->amount} via {$payout->account_type}.",
            $request
        );

        return response()->json([
            'message' => 'Staff payout updated successfully.',
            'payout' => $payout,
        ]);
    }

    /**
     * List Vendor Payouts with search, filters, pagination, and summary.
     */
    public function vendorPayouts(Request $request): JsonResponse
    {
        $query = Payout::with([
            'vendor:id,vendor_code,vendor_name,company_name,email,mobile',
            'superAdmin:id,name,email',
        ])->where('payout_type', Payout::TYPE_VENDOR);

        // Search by payout_number, vendor name, company name, vendor_code, note, or ref
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payout_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vq) use ($search) {
                        $vq->where('vendor_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%")
                            ->orWhere('vendor_code', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Vendor ID
        if ($vendorId = $request->input('vendor_id')) {
            if ($vendorId !== 'all' && $vendorId !== '') {
                $query->where('vendor_id', $vendorId);
            }
        }

        // Filter by Account Type
        if ($accountType = $request->input('account_type')) {
            if ($accountType !== 'all' && $accountType !== '') {
                $query->where('account_type', $accountType);
            }
        }

        // Date range filter
        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('payout_date', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('payout_date', '<=', $toDate);
        }

        // Summary calculations
        $summaryQuery = clone $query;
        $totalAmount = (float) $summaryQuery->sum('amount');
        $totalPayoutAmount = (float) (clone $query)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));
        $totalPaidAmount = (float) (clone $query)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalBalanceAmount = (float) (clone $query)->sum('balance_amount');
        $cashAmount = (float) (clone $query)->where('account_type', Payout::ACCOUNT_CASH)->sum('amount');
        $bankAmount = (float) (clone $query)->where('account_type', Payout::ACCOUNT_BANK)->sum('amount');
        $totalCount = $summaryQuery->count();

        // Sorting
        $sortBy = $request->input('sort_by', 'payout_date');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, ['id', 'payout_number', 'amount', 'payout_date', 'account_type', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');
        } else {
            $query->orderBy('payout_date', 'desc')->orderBy('id', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'payouts' => $paginated,
            'summary' => [
                'total_amount' => $totalAmount,
                'total_payout_amount' => $totalPayoutAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_balance_amount' => $totalBalanceAmount,
                'total_count' => $totalCount,
                'cash_amount' => $cashAmount,
                'bank_amount' => $bankAmount,
            ],
        ]);
    }

    /**
     * Store a new Vendor Payout.
     */
    public function storeVendorPayout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vendor_id' => ['required', 'exists:vendors,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payout_date' => ['required', 'date'],
            'account_type' => ['required', 'string', 'in:Cash,Bank'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $superAdmin = $request->user();
        $vendor = Vendor::findOrFail($validated['vendor_id']);

        $payoutNumber = Payout::generateUniqueNumber(Payout::TYPE_VENDOR);

        $amount = (float) $validated['amount'];
        $totalAmount = (float) ($request->input('total_amount') ?? $amount);
        $paidAmount = (float) ($request->input('paid_amount') ?? $amount);
        $balanceAmount = max(0.00, round($totalAmount - $paidAmount, 2));

        $status = Payout::STATUS_COMPLETED;
        if ($balanceAmount > 0 && $paidAmount > 0) {
            $status = Payout::STATUS_PARTIAL;
        } elseif ($paidAmount <= 0) {
            $status = Payout::STATUS_PENDING;
        }

        $payout = Payout::create([
            'payout_number' => $payoutNumber,
            'payout_type' => Payout::TYPE_VENDOR,
            'staff_id' => null,
            'vendor_id' => $vendor->id,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'amount' => $paidAmount,
            'payout_date' => $validated['payout_date'],
            'account_type' => $validated['account_type'],
            'reference_number' => $validated['reference_number'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => $status,
            'created_by_superadmin_id' => $superAdmin->id,
        ]);

        $payout->load([
            'vendor:id,vendor_code,vendor_name,company_name,email,mobile',
            'superAdmin:id,name,email',
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'vendor_payout_recorded',
            "Disbursed Vendor Payout of ₹{$payout->amount} via {$payout->account_type} to '{$vendor->vendor_name}' ({$vendor->vendor_code}) - Voucher: {$payout->payout_number}.",
            $request
        );

        return response()->json([
            'message' => 'Vendor payout recorded successfully.',
            'payout' => $payout,
        ], 201);
    }

    /**
     * Update an existing Vendor Payout.
     */
    public function updateVendorPayout(Request $request, string $id): JsonResponse
    {
        $payout = Payout::where('payout_type', Payout::TYPE_VENDOR)->findOrFail($id);

        $validated = $request->validate([
            'vendor_id' => ['required', 'exists:vendors,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payout_date' => ['required', 'date'],
            'account_type' => ['required', 'string', 'in:Cash,Bank'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $superAdmin = $request->user();
        $vendor = Vendor::findOrFail($validated['vendor_id']);

        $amount = (float) $validated['amount'];
        $totalAmount = (float) ($request->input('total_amount') ?? ($payout->total_amount > 0 ? $payout->total_amount : $amount));
        $paidAmount = (float) ($request->input('paid_amount') ?? $amount);
        $balanceAmount = max(0.00, round($totalAmount - $paidAmount, 2));

        $status = Payout::STATUS_COMPLETED;
        if ($balanceAmount > 0 && $paidAmount > 0) {
            $status = Payout::STATUS_PARTIAL;
        } elseif ($paidAmount <= 0) {
            $status = Payout::STATUS_PENDING;
        }

        $payout->update([
            'vendor_id' => $vendor->id,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'amount' => $paidAmount,
            'payout_date' => $validated['payout_date'],
            'account_type' => $validated['account_type'],
            'reference_number' => $validated['reference_number'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => $status,
        ]);

        $payout->load([
            'vendor:id,vendor_code,vendor_name,company_name,email,mobile',
            'superAdmin:id,name,email',
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'vendor_payout_updated',
            "Updated Vendor Payout voucher '{$payout->payout_number}' for '{$vendor->vendor_name}' ({$vendor->vendor_code}) - ₹{$payout->amount} via {$payout->account_type}.",
            $request
        );

        return response()->json([
            'message' => 'Vendor payout updated successfully.',
            'payout' => $payout,
        ]);
    }

    /**
     * Unified Payouts Ledger with comprehensive Date, Staff, Vendor, and Account Type filters.
     */
    public function ledger(Request $request): JsonResponse
    {
        $query = Payout::with([
            'staff:id,staff_code,name,department,designation',
            'vendor:id,vendor_code,vendor_name,company_name',
            'superAdmin:id,name,email',
        ]);

        // 1. Filter by Beneficiary Type (All, Staff, Vendor)
        if ($type = $request->input('payout_type')) {
            if (in_array($type, [Payout::TYPE_STAFF, Payout::TYPE_VENDOR])) {
                $query->where('payout_type', $type);
            }
        }

        // 2. Filter by Staff ID
        if ($staffId = $request->input('staff_id')) {
            if ($staffId !== 'all' && $staffId !== '') {
                $query->where('staff_id', $staffId);
            }
        }

        // 3. Filter by Vendor ID
        if ($vendorId = $request->input('vendor_id')) {
            if ($vendorId !== 'all' && $vendorId !== '') {
                $query->where('vendor_id', $vendorId);
            }
        }

        // 4. Filter by Account Type (Cash, Bank)
        if ($accountType = $request->input('account_type')) {
            if (in_array($accountType, [Payout::ACCOUNT_CASH, Payout::ACCOUNT_BANK])) {
                $query->where('account_type', $accountType);
            }
        }

        // 5. Date Range & Preset Filtering
        $preset = $request->input('preset', 'all_time');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        if ($preset && $preset !== 'all_time' && $preset !== 'custom') {
            $now = Carbon::now();
            match ($preset) {
                'today' => $query->whereDate('payout_date', $now->toDateString()),
                'last_7_days' => $query->whereDate('payout_date', '>=', $now->copy()->subDays(6)->toDateString()),
                'this_month' => $query->whereDate('payout_date', '>=', $now->copy()->startOfMonth()->toDateString())
                    ->whereDate('payout_date', '<=', $now->copy()->endOfMonth()->toDateString()),
                'last_30_days' => $query->whereDate('payout_date', '>=', $now->copy()->subDays(29)->toDateString()),
                default => null,
            };
        } else {
            if ($fromDate) {
                $query->whereDate('payout_date', '>=', $fromDate);
            }
            if ($toDate) {
                $query->whereDate('payout_date', '<=', $toDate);
            }
        }

        // 6. Search keyword
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payout_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%")
                    ->orWhereHas('staff', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('staff_code', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%");
                    })
                    ->orWhereHas('vendor', function ($vq) use ($search) {
                        $vq->where('vendor_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%")
                            ->orWhere('vendor_code', 'like', "%{$search}%");
                    });
            });
        }

        // Calculate KPI summary for the filtered dataset
        $summaryQuery = clone $query;
        $totalDisbursed = (float) $summaryQuery->sum('amount');
        $totalPayoutAmount = (float) (clone $query)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));
        $totalPaidAmount = (float) (clone $query)->sum(DB::raw('CASE WHEN paid_amount > 0 THEN paid_amount ELSE amount END'));
        $totalBalanceAmount = (float) (clone $query)->sum('balance_amount');

        $totalStaff = (float) (clone $query)->where('payout_type', Payout::TYPE_STAFF)->sum('amount');
        $totalStaffPayout = (float) (clone $query)->where('payout_type', Payout::TYPE_STAFF)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));
        $totalStaffBalance = (float) (clone $query)->where('payout_type', Payout::TYPE_STAFF)->sum('balance_amount');

        $totalVendor = (float) (clone $query)->where('payout_type', Payout::TYPE_VENDOR)->sum('amount');
        $totalVendorPayout = (float) (clone $query)->where('payout_type', Payout::TYPE_VENDOR)->sum(DB::raw('CASE WHEN total_amount > 0 THEN total_amount ELSE amount END'));
        $totalVendorBalance = (float) (clone $query)->where('payout_type', Payout::TYPE_VENDOR)->sum('balance_amount');

        $totalCash = (float) (clone $query)->where('account_type', Payout::ACCOUNT_CASH)->sum('amount');
        $totalBank = (float) (clone $query)->where('account_type', Payout::ACCOUNT_BANK)->sum('amount');
        $recordsCount = $summaryQuery->count();

        // Sorting
        $sortBy = $request->input('sort_by', 'payout_date');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, ['id', 'payout_number', 'amount', 'payout_date', 'payout_type', 'account_type', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');
        } else {
            $query->orderBy('payout_date', 'desc')->orderBy('id', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'ledger' => $paginated,
            'summary' => [
                'total_payout_amount' => $totalPayoutAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_balance_amount' => $totalBalanceAmount,
                'total_disbursed' => $totalDisbursed,
                'total_staff_payout' => $totalStaffPayout,
                'total_staff_disbursed' => $totalStaff,
                'total_staff_balance' => $totalStaffBalance,
                'total_vendor_payout' => $totalVendorPayout,
                'total_vendor_disbursed' => $totalVendor,
                'total_vendor_balance' => $totalVendorBalance,
                'total_cash_disbursed' => $totalCash,
                'total_bank_disbursed' => $totalBank,
                'records_count' => $recordsCount,
            ],
        ]);
    }

    /**
     * Show a single Payout voucher.
     */
    public function show(string $id): JsonResponse
    {
        $payout = Payout::with([
            'staff:id,staff_code,name,department,designation,email,mobile',
            'vendor:id,vendor_code,vendor_name,company_name,email,mobile',
            'superAdmin:id,name,email',
        ])->find($id);

        if (! $payout) {
            return response()->json([
                'message' => 'Payout record not found.',
            ], 404);
        }

        return response()->json([
            'payout' => $payout,
        ]);
    }

    /**
     * Delete / Void a payout voucher is forbidden.
     * Payout records cannot be deleted to preserve financial audit trail; they can only be edited.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json([
            'message' => 'Payout records cannot be deleted. They can only be edited.',
        ], 403);
    }
}
