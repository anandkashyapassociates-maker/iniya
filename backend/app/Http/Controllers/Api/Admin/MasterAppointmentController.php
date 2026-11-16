<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Clinic;
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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MasterAppointmentController extends Controller
{
    /**
     * Display a listing of master appointments with filters, search, and session summaries.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MasterAppointment::with([
            'clinic:id,clinic_code,name,branch_name,location,address,city,state,postal_code,phone,email',
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

        // Enforce clinic isolation: Logged-in admin/staff must strictly access appointments of their assigned clinic
        $user = $request->user();
        $clinicInput = $request->input('clinic_id');
        if ($user && ! empty($user->clinic_id)) {
            $query->where('clinic_id', $user->clinic_id);
        } elseif (! empty($clinicInput) && $clinicInput !== 'all') {
            $query->where('clinic_id', $clinicInput);
        }

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

            // Self-heal: ensure appointment_fees matches current sessions sum
            if ($sessions->isNotEmpty()) {
                $computedFee = $sessions->reduce(function ($sum, $s) {
                    $price = $s->service?->price ?? $s->payment_amount ?? 0;
                    return $sum + (float) $price;
                }, 0.0);
                if ($computedFee > 0 && abs((float) $appt->appointment_fees - $computedFee) > 0.001) {
                    $appt->appointment_fees = $computedFee;
                    $appt->saveQuietly();
                }
            }

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
    public function stats(Request $request): JsonResponse
    {
        $admin = $request->user();
        $adminId = $admin?->id;
        if ($admin && ! empty($admin->clinic_id)) {
            $clinicId = $admin->clinic_id;
        } else {
            $clinicInput = $request->input('clinic_id');
            $clinicId = (! empty($clinicInput) && $clinicInput !== 'all') ? $clinicInput : null;
        }
        $isStaffUser = ($admin instanceof Staff)
            || (isset($admin->role) && in_array(strtolower($admin->role), ['staff', 'staff practitioner']))
            || (isset($admin->user_type) && strtolower($admin->user_type) === 'staff')
            || ($admin && ! empty($admin->staff_code))
            || ($request->user() && $request->user()->tokenCan('role:staff'));

        $todayStr = Carbon::today()->toDateString();
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
            $sessionsQuery->where('staff_id', $adminId);
        }

        $totalSessions = (clone $sessionsQuery)->count();
        $todaySessions = (clone $sessionsQuery)->whereDate('session_date', $todayStr)
            ->where('status', '!=', AppointmentSession::STATUS_CANCELLED)
            ->count();
        $upcomingSessions = (clone $sessionsQuery)->where('session_date', '>=', $todayStr)
            ->whereIn('status', [AppointmentSession::STATUS_PENDING, AppointmentSession::STATUS_IN_PROGRESS])
            ->count();
        $pendingSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_PENDING)->count();
        $inProgressSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $completedSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $cancelledSessions = (clone $sessionsQuery)->where('status', AppointmentSession::STATUS_CANCELLED)->count();

        if ($isStaffUser && $adminId) {
            $todayRevenue = (float) (clone $sessionsQuery)->whereDate('session_date', $todayStr)
                ->where('status', AppointmentSession::STATUS_COMPLETED)
                ->sum('staff_commission');
            $totalRevenue = (float) (clone $sessionsQuery)
                ->where('status', AppointmentSession::STATUS_COMPLETED)
                ->sum('staff_commission');
        } else {
            $todayRevenue = (float) (clone $masterQuery)->whereDate('appointment_date', $todayStr)->sum('appointment_fees');
            $totalRevenue = (float) (clone $masterQuery)->sum('appointment_fees');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_master' => $totalMasterAppointments,
                'today_master' => $todayMasterAppointments,
                'total_sessions' => $totalSessions,
                'today_sessions' => $todaySessions,
                'upcoming_sessions' => $upcomingSessions,
                'pending_sessions' => $pendingSessions,
                'in_progress_sessions' => $inProgressSessions,
                'completed_sessions' => $completedSessions,
                'cancelled_sessions' => $cancelledSessions,
                'today_revenue' => $todayRevenue,
                'total_revenue' => $totalRevenue,
            ],
        ]);
    }

    /**
     * Provide options for searchable dropdowns (Customers, Sales Members, Staff, Inventory Products).
     * Scoped clinic-wise for Staff, Sales Members, and Inventory Products; Customers remain global.
     */
    public function options(Request $request): JsonResponse
    {
        $user = $request->user();
        $clinicId = $user?->clinic_id;

        // Customers remain global across clinics as explicitly requested
        $customers = Customer::where('is_active', true)
            ->select('id', 'name', 'mobile', 'email', 'gender')
            ->orderBy('name')
            ->get();

        $salesQuery = SalesMember::where('status', SalesMember::STATUS_ACTIVE);
        if ($clinicId) {
            $salesQuery->where('clinic_id', $clinicId);
        }
        $salesMembers = $salesQuery
            ->select('id', 'clinic_id', 'sales_code', 'name', 'email', 'mobile', 'department', 'designation')
            ->orderBy('name')
            ->get();

        $staffQuery = Staff::where('is_active', true)
            ->where('status', Staff::STATUS_ACTIVE);
        if ($clinicId) {
            $staffQuery->where('clinic_id', $clinicId);
        }
        $staff = $staffQuery
            ->select('id', 'clinic_id', 'staff_code', 'name', 'email', 'mobile', 'department', 'designation')
            ->orderBy('name')
            ->get();

        $inventoryQuery = InventoryProduct::where('status', 'active');
        if ($clinicId) {
            $inventoryQuery->where('clinic_id', $clinicId);
        }
        $inventoryProducts = $inventoryQuery
            ->select('id', 'clinic_id', 'product_name', 'business_unit', 'product_type')
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

        $clinicsQuery = Clinic::where('status', Clinic::STATUS_ACTIVE);
        if ($clinicId) {
            $clinicsQuery->where('id', $clinicId);
        }
        $clinics = $clinicsQuery
            ->select('id', 'name', 'branch_name', 'location', 'clinic_code')
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
                'clinics' => $clinics,
            ],
        ]);
    }

    /**
     * Store a new Master Appointment along with unlimited dynamic sessions in a database transaction.
     */
    public function store(Request $request): JsonResponse
    {
        if (is_string($request->input('sessions'))) {
            $decodedSessions = json_decode($request->input('sessions'), true);
            if (is_array($decodedSessions)) {
                $request->merge(['sessions' => $decodedSessions]);
            }
        }

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'sales_team_id' => ['required', 'exists:sales_members,id'],
            'sales_commission' => ['nullable', 'numeric', 'min:0'],
            'appointment_fees' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'sessions' => ['required', 'array', 'min:1'],
            'sessions.*.service_id' => ['required', 'exists:services,id'],
            'sessions.*.treatment_details' => ['nullable', 'string', 'max:5000'],
            'sessions.*.session_date' => ['required', 'date', 'after_or_equal:today'],
            'sessions.*.session_time' => ['required', 'string', 'max:20'],
            'sessions.*.staff_id' => ['required', 'exists:staff,id'],
            'sessions.*.staff_commission' => ['required', 'numeric', 'min:0'],
            'sessions.*.inventory_product_id' => ['nullable'],
            'sessions.*.inventory_product_ids' => ['nullable', 'array'],
            'sessions.*.inventory_product_ids.*' => ['integer', 'exists:inventory_products,id'],
            'sessions.*.image' => ['nullable'],
        ]);

        // Process mandatory appointment image
        $imagePath = null;
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:10240'],
            ], [
                'image.file' => 'The appointment image must be a valid image file.',
                'image.mimes' => 'The appointment image must be a file of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The appointment image size cannot exceed 10MB.',
            ]);
            $imagePath = $request->file('image')->store('appointments', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'appointments/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $imagePath = $fileName;
                }
            }
        }

        if (! $imagePath) {
            throw ValidationException::withMessages([
                'image' => ['The appointment image is required.'],
            ]);
        }

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

        $user = $request->user();
        $clinicId = $user?->clinic_id ?? $request->input('clinic_id') ?? \App\Models\Clinic::orderBy('id')->value('id');

        // Enforce clinic integrity: sales member, staff, and inventory products must belong to the clinic
        if ($clinicId) {
            $salesValid = SalesMember::where('id', $validated['sales_team_id'])
                ->where('clinic_id', $clinicId)
                ->exists();
            if (! $salesValid) {
                throw ValidationException::withMessages([
                    'sales_team_id' => ['Selected sales member does not belong to your assigned clinic.'],
                ]);
            }

            foreach ($validated['sessions'] as $idx => $sData) {
                $staffValid = Staff::where('id', $sData['staff_id'])
                    ->where('clinic_id', $clinicId)
                    ->exists();
                if (! $staffValid) {
                    throw ValidationException::withMessages([
                        "sessions.{$idx}.staff_id" => ['Selected staff member does not belong to your assigned clinic.'],
                    ]);
                }

                $productIds = ! empty($sData['inventory_product_ids'])
                    ? array_map('intval', (array) $sData['inventory_product_ids'])
                    : (! empty($sData['inventory_product_id']) ? [(int) $sData['inventory_product_id']] : []);

                if (! empty($productIds)) {
                    $invalidProducts = InventoryProduct::whereIn('id', $productIds)
                        ->where('clinic_id', '!=', $clinicId)
                        ->exists();
                    if ($invalidProducts) {
                        throw ValidationException::withMessages([
                            "sessions.{$idx}.inventory_product_id" => ['Selected inventory product does not belong to your assigned clinic.'],
                        ]);
                    }
                }
            }
        }

        $masterAppointment = DB::transaction(function () use ($validated, $request, $imagePath, $clinicId) {
            $appointmentNumber = MasterAppointment::generateUniqueNumber($validated['appointment_date']);

            $master = MasterAppointment::create([
                'clinic_id' => $clinicId,
                'appointment_number' => $appointmentNumber,
                'customer_id' => $validated['customer_id'],
                'appointment_date' => $validated['appointment_date'],
                'sales_team_id' => $validated['sales_team_id'],
                'sales_commission' => $validated['sales_commission'] ?? 0.00,
                'appointment_fees' => $validated['appointment_fees'],
                'notes' => $validated['notes'] ?? null,
                'image' => $imagePath,
                'admin_id' => $request->user()?->id,
            ]);

            foreach ($validated['sessions'] as $i => $sData) {
                $productIds = ! empty($sData['inventory_product_ids'])
                    ? array_map('intval', (array) $sData['inventory_product_ids'])
                    : (! empty($sData['inventory_product_id']) ? [(int) $sData['inventory_product_id']] : []);

                // Process optional session image
                $sessionImagePath = null;
                if (! empty($sData['image']) && is_string($sData['image']) && str_starts_with($sData['image'], 'data:image')) {
                    $sDataUri = $sData['image'];
                    if (preg_match('/^data:image\/(\w+);base64,/', $sDataUri, $sType)) {
                        $sDataDecoded = substr($sDataUri, strpos($sDataUri, ',') + 1);
                        $sTypeStr = strtolower($sType[1]);
                        $sBinary = base64_decode($sDataDecoded);
                        if ($sBinary !== false) {
                            $sFileName = 'appointment_sessions/'.Str::random(40).'.'.$sTypeStr;
                            Storage::disk('public')->put($sFileName, $sBinary);
                            $sessionImagePath = $sFileName;
                        }
                    }
                } elseif ($request->hasFile("sessions.{$i}.image")) {
                    $sessionImagePath = $request->file("sessions.{$i}.image")->store('appointment_sessions', 'public');
                }

                AppointmentSession::create([
                    'master_appointment_id' => $master->id,
                    'session_number' => $i + 1,
                    'service_id' => ! empty($sData['service_id']) ? $sData['service_id'] : null,
                    'treatment_details' => $sData['treatment_details'] ?? '',
                    'image' => $sessionImagePath,
                    'session_date' => $sData['session_date'],
                    'session_time' => $sData['session_time'],
                    'staff_id' => $sData['staff_id'],
                    'staff_commission' => $sData['staff_commission'],
                    'inventory_product_id' => ! empty($productIds) ? $productIds[0] : null,
                    'inventory_product_ids' => ! empty($productIds) ? $productIds : null,
                    'status' => AppointmentSession::STATUS_PENDING,
                ]);
            }

            $master->recalculateFees();

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
            'clinic:id,clinic_code,name,branch_name,location,address,city,state,postal_code,phone,email',
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

        $user = request()->user();
        if ($user && ! empty($user->clinic_id) && (int) $master->clinic_id !== (int) $user->clinic_id) {
            return response()->json([
                'message' => 'Unauthorized: This master appointment belongs to a different clinic branch.',
            ], 403);
        }

        if ($master->sessions->isNotEmpty()) {
            $computedFee = $master->sessions->reduce(function ($sum, $s) {
                $price = $s->service?->price ?? $s->payment_amount ?? 0;
                return $sum + (float) $price;
            }, 0.0);
            if ($computedFee > 0 && abs((float) $master->appointment_fees - $computedFee) > 0.001) {
                $master->appointment_fees = $computedFee;
                $master->saveQuietly();
            }
        }

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

        $user = $request->user();
        if ($user && ! empty($user->clinic_id) && (int) $master->clinic_id !== (int) $user->clinic_id) {
            return response()->json([
                'message' => 'Unauthorized: This master appointment belongs to a different clinic branch.',
            ], 403);
        }

        $validated = $request->validate([
            'customer_id' => ['sometimes', 'required', 'exists:customers,id'],
            'appointment_date' => ['sometimes', 'required', 'date'],
            'sales_team_id' => ['sometimes', 'required', 'exists:sales_members,id'],
            'sales_commission' => ['nullable', 'numeric', 'min:0'],
            'appointment_fees' => ['sometimes', 'required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:10240'],
            ], [
                'image.file' => 'The appointment image must be a valid image file.',
                'image.mimes' => 'The appointment image must be of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The appointment image size cannot exceed 10MB.',
            ]);
            if ($master->image && Storage::disk('public')->exists($master->image)) {
                Storage::disk('public')->delete($master->image);
            }
            $validated['image'] = $request->file('image')->store('appointments', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    if ($master->image && Storage::disk('public')->exists($master->image)) {
                        Storage::disk('public')->delete($master->image);
                    }
                    $fileName = 'appointments/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $validated['image'] = $fileName;
                }
            }
        }

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

        $user = request()->user();
        if ($user && ! empty($user->clinic_id) && (int) $master->clinic_id !== (int) $user->clinic_id) {
            return response()->json([
                'message' => 'Unauthorized: This master appointment belongs to a different clinic branch.',
            ], 403);
        }

        DB::transaction(function () use ($master) {
            foreach ($master->sessions as $session) {
                if ($session->image && Storage::disk('public')->exists($session->image)) {
                    Storage::disk('public')->delete($session->image);
                }
                $session->rescheduleHistories()->delete();
                $session->delete();
            }

            if ($master->image && Storage::disk('public')->exists($master->image)) {
                Storage::disk('public')->delete($master->image);
            }

            $master->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Master appointment and its sessions deleted successfully.',
        ]);
    }

    /**
     * Get receipt data for a master appointment.
     */
    public function receipt(Request $request, int $id): JsonResponse
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
                ])->orderBy('session_number');
            },
        ])->findOrFail($id);

        $user = $request->user();
        if ($user && ! empty($user->clinic_id) && (int) $master->clinic_id !== (int) $user->clinic_id) {
            return response()->json([
                'message' => 'Unauthorized: This master appointment belongs to a different clinic branch.',
            ], 403);
        }

        if ($master->sessions->isNotEmpty()) {
            $computedFee = $master->sessions->reduce(function ($sum, $s) {
                $price = $s->service?->price ?? $s->payment_amount ?? 0;
                return $sum + (float) $price;
            }, 0.0);
            if ($computedFee > 0 && abs((float) $master->appointment_fees - $computedFee) > 0.001) {
                $master->appointment_fees = $computedFee;
                $master->saveQuietly();
            }
        }

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'master_appointment_receipt_viewed',
                "Admin '{$admin->name}' generated receipt for Master Appointment #{$master->appointment_number}.",
                $request
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'receipt_number' => 'RCP-M'.str_pad((string) $master->id, 5, '0', STR_PAD_LEFT),
                'receipt_date' => Carbon::now()->toIso8601String(),
                'appointment' => $master,
            ],
        ]);
    }
}
