<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\InventoryProduct;
use App\Models\MasterAppointment;
use App\Models\SalesMember;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MasterAppointmentController extends Controller
{
    /**
     * Display a listing of master appointments with filters, search, and session summaries.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MasterAppointment::with([
            'customer:id,name,mobile,email,gender',
            'salesTeam:id,sales_code,name,email,mobile,department',
            'admin:id,name,email',
            'sessions' => function ($q) {
                $q->with([
                    'staff:id,staff_code,name,department,designation',
                    'inventoryProduct:id,product_name,business_unit',
                    'service:id,service_category_id,name,price',
                    'service.category:id,parent_id,name',
                    'service.category.parent:id,name',
                ])->orderBy('session_number');
            },
        ]);

        // Search by appointment number, customer name/mobile, or sales member name/code
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('appointment_number', 'like', "%{$search}%")
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

        // Filter by Customer
        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        // Filter by Sales Team / Sales Member
        if ($salesTeamId = $request->input('sales_team_id')) {
            $query->where('sales_team_id', $salesTeamId);
        }

        // Filter by Date (today, preview, or exact date)
        if ($dateFilter = $request->input('date')) {
            $today = Carbon::today()->toDateString();
            if ($dateFilter === 'current' || $dateFilter === 'today') {
                $query->whereDate('appointment_date', $today);
            } elseif ($dateFilter === 'preview' || $dateFilter === 'other') {
                $query->whereDate('appointment_date', '!=', $today);
            } elseif ($dateFilter === 'upcoming') {
                $query->whereDate('appointment_date', '>=', $today);
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
                $query->whereDate('appointment_date', $dateFilter);
            }
        }

        // Filter by Session Status (e.g. show appointments that have sessions with this status)
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                $query->whereHas('sessions', function ($sq) use ($status) {
                    $sq->where('status', $status);
                });
            }
        }

        $perPage = (int) $request->input('per_page', 10);
        $appointments = $query->orderByDesc('id')->paginate($perPage);

        // Append session count statistics to each master appointment for easy frontend consumption
        $appointments->getCollection()->transform(function (MasterAppointment $appt) {
            $sessions = $appt->sessions;
            $appt->total_sessions_count = $sessions->count();
            $appt->pending_sessions_count = $sessions->where('status', AppointmentSession::STATUS_PENDING)->count();
            $appt->in_progress_sessions_count = $sessions->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
            $appt->completed_sessions_count = $sessions->where('status', AppointmentSession::STATUS_COMPLETED)->count();
            $appt->cancelled_sessions_count = $sessions->where('status', AppointmentSession::STATUS_CANCELLED)->count();

            return $appt;
        });

        return response()->json([
            'success' => true,
            'data' => $appointments,
        ]);
    }

    /**
     * Get aggregate statistics for the dashboard cards.
     */
    public function stats(): JsonResponse
    {
        $totalMasterAppointments = MasterAppointment::count();
        $totalSessions = AppointmentSession::count();
        $pendingSessions = AppointmentSession::where('status', AppointmentSession::STATUS_PENDING)->count();
        $inProgressSessions = AppointmentSession::where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $completedSessions = AppointmentSession::where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $cancelledSessions = AppointmentSession::where('status', AppointmentSession::STATUS_CANCELLED)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_master' => $totalMasterAppointments,
                'total_sessions' => $totalSessions,
                'pending_sessions' => $pendingSessions,
                'in_progress_sessions' => $inProgressSessions,
                'completed_sessions' => $completedSessions,
                'cancelled_sessions' => $cancelledSessions,
            ],
        ]);
    }

    /**
     * Provide options for searchable dropdowns (Customers, Sales Members, Staff, Inventory Products).
     */
    public function options(): JsonResponse
    {
        $customers = Customer::where('is_active', true)
            ->select('id', 'name', 'mobile', 'email', 'gender')
            ->orderBy('name')
            ->get();

        $salesMembers = SalesMember::where('status', SalesMember::STATUS_ACTIVE)
            ->select('id', 'sales_code', 'name', 'email', 'mobile', 'department', 'designation')
            ->orderBy('name')
            ->get();

        $staff = Staff::where('is_active', true)
            ->where('status', Staff::STATUS_ACTIVE)
            ->select('id', 'staff_code', 'name', 'email', 'mobile', 'department', 'designation')
            ->orderBy('name')
            ->get();

        $inventoryProducts = InventoryProduct::where('status', 'active')
            ->select('id', 'product_name', 'business_unit', 'product_type')
            ->orderBy('product_name')
            ->get();

        $servicesTree = ServiceCategory::categories()
            ->where('status', 'active')
            ->with([
                'children' => function ($q) {
                    $q->where('status', 'active')->orderBy('name')->with([
                        'services' => function ($sq) {
                            $sq->where('status', 'active')->orderBy('name');
                        },
                    ]);
                },
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'customers' => $customers,
                'sales_teams' => $salesMembers,
                'staff' => $staff,
                'inventory_products' => $inventoryProducts,
                'services_tree' => $servicesTree,
            ],
        ]);
    }

    /**
     * Store a new Master Appointment along with unlimited dynamic sessions in a database transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'sales_team_id' => ['required', 'exists:sales_members,id'],
            'appointment_fees' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'sessions' => ['required', 'array', 'min:1'],
            'sessions.*.service_id' => ['nullable', 'exists:services,id'],
            'sessions.*.treatment_details' => ['nullable', 'string', 'max:5000'],
            'sessions.*.session_date' => ['required', 'date', 'after_or_equal:today'],
            'sessions.*.session_time' => ['required', 'string', 'max:20'],
            'sessions.*.staff_id' => ['required', 'exists:staff,id'],
            'sessions.*.staff_commission' => ['required', 'numeric', 'min:0'],
            'sessions.*.inventory_product_id' => ['nullable'],
            'sessions.*.inventory_product_ids' => ['nullable', 'array'],
            'sessions.*.inventory_product_ids.*' => ['integer', 'exists:inventory_products,id'],
        ]);

        // Validate that session times for today are not in the past (with a 5-minute grace buffer)
        $today = Carbon::today()->toDateString();
        $now = Carbon::now()->subMinutes(5);

        foreach ($validated['sessions'] as $idx => $sessionData) {
            if ($sessionData['session_date'] === $today) {
                try {
                    $timeClean = trim((string) $sessionData['session_time']);
                    $sessionDateTime = Carbon::parse("{$today} {$timeClean}");
                    if ($sessionDateTime->lt($now)) {
                        throw ValidationException::withMessages([
                            "sessions.{$idx}.session_time" => ['Session #'.($idx + 1)." time ({$sessionData['session_time']}) is in the past for today."],
                        ]);
                    }
                } catch (\Exception $e) {
                    if ($e instanceof ValidationException) {
                        throw $e;
                    }
                }
            }
        }

        $masterAppointment = DB::transaction(function () use ($validated, $request) {
            $appointmentNumber = MasterAppointment::generateUniqueNumber($validated['appointment_date']);

            $master = MasterAppointment::create([
                'appointment_number' => $appointmentNumber,
                'customer_id' => $validated['customer_id'],
                'appointment_date' => $validated['appointment_date'],
                'sales_team_id' => $validated['sales_team_id'],
                'appointment_fees' => $validated['appointment_fees'],
                'notes' => $validated['notes'] ?? null,
                'admin_id' => $request->user()?->id,
            ]);

            foreach ($validated['sessions'] as $i => $sData) {
                $productIds = ! empty($sData['inventory_product_ids'])
                    ? array_map('intval', (array) $sData['inventory_product_ids'])
                    : (! empty($sData['inventory_product_id']) ? [(int) $sData['inventory_product_id']] : []);

                AppointmentSession::create([
                    'master_appointment_id' => $master->id,
                    'session_number' => $i + 1,
                    'service_id' => ! empty($sData['service_id']) ? $sData['service_id'] : null,
                    'treatment_details' => $sData['treatment_details'] ?? '',
                    'session_date' => $sData['session_date'],
                    'session_time' => $sData['session_time'],
                    'staff_id' => $sData['staff_id'],
                    'staff_commission' => $sData['staff_commission'],
                    'inventory_product_id' => ! empty($productIds) ? $productIds[0] : null,
                    'inventory_product_ids' => ! empty($productIds) ? $productIds : null,
                    'status' => AppointmentSession::STATUS_PENDING,
                ]);
            }

            return $master->load([
                'customer:id,name,mobile,email',
                'salesTeam:id,sales_code,name,department',
                'sessions.staff:id,staff_code,name,department',
                'sessions.inventoryProduct:id,product_name',
                'sessions.service.category.parent',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Master appointment with '.count($validated['sessions']).' session(s) created successfully.',
            'data' => $masterAppointment,
        ], 201);
    }

    /**
     * Display a single master appointment with all sessions and complete details.
     */
    public function show(int $id): JsonResponse
    {
        $master = MasterAppointment::with([
            'customer',
            'salesTeam',
            'admin:id,name,email',
            'sessions' => function ($q) {
                $q->with([
                    'staff',
                    'inventoryProduct',
                    'service.category.parent',
                    'rescheduleHistories.oldStaff',
                    'rescheduleHistories.newStaff',
                ])->orderBy('session_number');
            },
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $master,
        ]);
    }

    /**
     * Update the master appointment level fields (appointment_date, sales_team_id, appointment_fees, notes).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $master = MasterAppointment::findOrFail($id);

        $validated = $request->validate([
            'customer_id' => ['sometimes', 'required', 'exists:customers,id'],
            'appointment_date' => ['sometimes', 'required', 'date'],
            'sales_team_id' => ['sometimes', 'required', 'exists:sales_members,id'],
            'appointment_fees' => ['sometimes', 'required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $master->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Master appointment details updated successfully.',
            'data' => $master->fresh(['customer', 'salesTeam', 'sessions']),
        ]);
    }

    /**
     * Delete a master appointment and all its child sessions.
     */
    public function destroy(int $id): JsonResponse
    {
        $master = MasterAppointment::find($id);

        if (! $master) {
            return response()->json([
                'success' => true,
                'message' => 'Master appointment already removed.',
            ]);
        }

        DB::transaction(function () use ($master) {
            $master->delete(); // cascades to sessions due to DB foreign key onDelete('cascade')
        });

        return response()->json([
            'success' => true,
            'message' => 'Master appointment and its sessions deleted successfully.',
        ]);
    }
}
