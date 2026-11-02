<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments with advanced filters and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with([
            'customer:id,name,mobile,email,gender',
            'staff:id,name,staff_code,department,designation,mobile',
            'admin:id,name,email',
        ]);

        // Search by customer name/mobile/email, appointment number, treatment name, or staff name
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('appointment_number', 'like', "%{$search}%")
                    ->orWhere('treatment_name', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('staff', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('staff_code', 'like', "%{$search}%")
                            ->orWhere('department', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Status
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, ['pending', 'confirmed', 'completed', 'cancelled'], true)) {
                $query->where('status', $status);
            }
        }

        // Filter by Date (today, preview/previous/other, upcoming, past, or exact Y-m-d)
        if ($dateFilter = $request->input('date')) {
            $today = Carbon::today()->toDateString();
            if ($dateFilter === 'current' || $dateFilter === 'today') {
                $query->whereDate('appointment_date', $today);
            } elseif ($dateFilter === 'preview' || $dateFilter === 'other') {
                $query->whereDate('appointment_date', '!=', $today);
            } elseif ($dateFilter === 'upcoming') {
                $query->whereDate('appointment_date', '>=', $today);
            } elseif ($dateFilter === 'past') {
                $query->whereDate('appointment_date', '<', $today);
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
                $query->whereDate('appointment_date', $dateFilter);
            }
        }

        // Filter by Session Slot (Morning, Afternoon, Evening)
        if ($slot = $request->input('session_slot')) {
            if ($slot !== 'all' && in_array($slot, ['Morning', 'Afternoon', 'Evening'], true)) {
                $query->where('session_slot', $slot);
            }
        }

        // Filter by Staff ID
        if ($staffId = $request->input('staff_id')) {
            $query->where('staff_id', $staffId);
        }

        // Filter by Customer ID
        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $appointments = $query->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($appointments);
    }

    /**
     * Return summary metrics for appointments.
     */
    public function stats(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        $stats = [
            'total' => Appointment::count(),
            'today' => Appointment::whereDate('appointment_date', $today)->where('status', '!=', 'cancelled')->count(),
            'scheduled' => Appointment::whereIn('status', ['pending', 'confirmed', 'scheduled'])->count(),
            'pending' => Appointment::where('status', 'pending')->count(),
            'confirmed' => Appointment::where('status', 'confirmed')->count(),
            'completed' => Appointment::where('status', 'completed')->count(),
            'cancelled' => Appointment::where('status', 'cancelled')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => [
                'required',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($request) {
                    $date = $request->input('appointment_date');
                    if ($date && Carbon::parse($date)->isToday()) {
                        try {
                            $selectedTime = Carbon::createFromFormat('H:i', $value);
                        } catch (\Exception $e) {
                            try {
                                $selectedTime = Carbon::parse($value);
                            } catch (\Exception $e) {
                                return;
                            }
                        }

                        if ($selectedTime && $selectedTime->lt(now())) {
                            $fail('Appointment time cannot be in the past for today.');
                        }
                    }
                },
            ],
            'session_slot' => ['required', Rule::in(['Morning', 'Afternoon', 'Evening'])],
            'session_number' => ['required', 'integer', 'min:1', 'max:100'],
            'total_sessions' => ['required', 'integer', 'min:1', 'max:100', 'gte:session_number'],
            'treatment_name' => ['required', 'string', 'max:255'],
            'treatment_details' => ['nullable', 'string', 'max:2000'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['pending', 'paid', 'waived'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $admin = $request->user();

        $appointment = Appointment::create([
            'appointment_number' => Appointment::generateAppointmentNumber(),
            'customer_id' => $validated['customer_id'],
            'staff_id' => $validated['staff_id'] ?? null,
            'admin_id' => $admin->id,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'session_slot' => $validated['session_slot'],
            'session_number' => $validated['session_number'],
            'total_sessions' => $validated['total_sessions'],
            'treatment_name' => $validated['treatment_name'],
            'treatment_details' => $validated['treatment_details'] ?? null,
            'status' => 'pending',
            'fee' => $validated['fee'] ?? 0.00,
            'payment_status' => $validated['payment_status'] ?? 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_booked',
            "Admin '{$admin->name}' booked appointment '{$appointment->appointment_number}' for customer ID {$appointment->customer_id}.",
            $request
        );

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'appointment' => $appointment->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ], 201);
    }

    /**
     * Display the specified appointment.
     */
    public function show(int $id): JsonResponse
    {
        $appointment = Appointment::with([
            'customer:id,name,mobile,email,gender,age,address',
            'staff:id,name,staff_code,department,designation,mobile,email',
            'admin:id,name,email',
        ])->findOrFail($id);

        return response()->json($appointment);
    }

    /**
     * Update treatment details and notes of an appointment.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => [
                'required',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($request) {
                    $date = $request->input('appointment_date');
                    if ($date && Carbon::parse($date)->isToday()) {
                        try {
                            $selectedTime = Carbon::createFromFormat('H:i', $value);
                        } catch (\Exception $e) {
                            try {
                                $selectedTime = Carbon::parse($value);
                            } catch (\Exception $e) {
                                return;
                            }
                        }

                        if ($selectedTime && $selectedTime->lt(now())) {
                            $fail('Appointment time cannot be in the past for today.');
                        }
                    }
                },
            ],
            'session_slot' => ['required', Rule::in(['Morning', 'Afternoon', 'Evening'])],
            'session_number' => ['required', 'integer', 'min:1', 'max:100'],
            'total_sessions' => ['required', 'integer', 'min:1', 'max:100', 'gte:session_number'],
            'treatment_name' => ['required', 'string', 'max:255'],
            'treatment_details' => ['nullable', 'string', 'max:2000'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['pending', 'paid', 'waived'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $appointment->update($validated);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_updated',
            "Admin '{$admin->name}' updated appointment '{$appointment->appointment_number}'.",
            $request
        );

        return response()->json([
            'message' => 'Appointment details updated successfully.',
            'appointment' => $appointment->fresh()->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ]);
    }

    /**
     * Reschedule an appointment to a new date, time, and session slot.
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'message' => 'Cancelled appointments cannot be rescheduled.',
            ], 422);
        }

        $validated = $request->validate([
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => [
                'required',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($request) {
                    $date = $request->input('appointment_date');
                    if ($date && Carbon::parse($date)->isToday()) {
                        try {
                            $selectedTime = Carbon::createFromFormat('H:i', $value);
                        } catch (\Exception $e) {
                            try {
                                $selectedTime = Carbon::parse($value);
                            } catch (\Exception $e) {
                                return;
                            }
                        }

                        if ($selectedTime && $selectedTime->lt(now())) {
                            $fail('Appointment time cannot be in the past for today.');
                        }
                    }
                },
            ],
            'session_slot' => ['required', Rule::in(['Morning', 'Afternoon', 'Evening'])],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        // Keep previous appointment details for audit trail
        $appointment->update([
            'previous_appointment_date' => $appointment->appointment_date instanceof \DateTimeInterface
                ? $appointment->appointment_date->format('Y-m-d')
                : $appointment->appointment_date,
            'previous_appointment_time' => $appointment->appointment_time,
            'previous_session_slot' => $appointment->session_slot,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'session_slot' => $validated['session_slot'],
            'rescheduled_reason' => $validated['reason'],
            'rescheduled_at' => now(),
            'status' => 'confirmed',
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_rescheduled',
            "Admin '{$admin->name}' rescheduled appointment '{$appointment->appointment_number}' to {$validated['appointment_date']}.",
            $request
        );

        return response()->json([
            'message' => 'Appointment rescheduled successfully.',
            'appointment' => $appointment->fresh()->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ]);
    }

    /**
     * Cancel an appointment with a mandatory reason.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'message' => 'Appointment is already cancelled.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $appointment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $validated['reason'],
            'cancelled_at' => now(),
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_cancelled',
            "Admin '{$admin->name}' cancelled appointment '{$appointment->appointment_number}'. Reason: {$validated['reason']}",
            $request
        );

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'appointment' => $appointment->fresh()->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ]);
    }

    /**
     * Assign or update the staff member assigned to this appointment.
     */
    public function assignStaff(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staff,id'],
        ]);

        $staff = Staff::findOrFail($validated['staff_id']);

        $appointment->update([
            'staff_id' => $staff->id,
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_staff_assigned',
            "Admin '{$admin->name}' assigned staff '{$staff->name}' ({$staff->staff_code}) to appointment '{$appointment->appointment_number}'.",
            $request
        );

        return response()->json([
            'message' => "Staff '{$staff->name}' assigned successfully.",
            'appointment' => $appointment->fresh()->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ]);
    }

    /**
     * Update appointment status (completed, no_show, etc.).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'completed', 'cancelled'])],
        ]);

        $appointment->update([
            'status' => $validated['status'],
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'appointment_status_changed',
            "Admin '{$admin->name}' updated appointment '{$appointment->appointment_number}' status to {$validated['status']}.",
            $request
        );

        return response()->json([
            'message' => "Appointment marked as {$validated['status']}.",
            'appointment' => $appointment->fresh()->load([
                'customer:id,name,mobile,email,gender',
                'staff:id,name,staff_code,department,designation',
                'admin:id,name,email',
            ]),
        ]);
    }

    /**
     * Delete an appointment.
     */
    public function destroy(int $id): JsonResponse
    {
        $appointment = Appointment::find($id);

        if (! $appointment) {
            return response()->json([
                'success' => true,
                'message' => 'Appointment already removed.',
            ]);
        }

        $appointment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Appointment deleted successfully.',
        ]);
    }

    /**
     * Provide active staff members for dropdown select in appointment forms.
     */
    public function staffOptions(): JsonResponse
    {
        $staff = Staff::where('status', 'active')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'staff_code', 'name', 'department', 'designation', 'mobile']);

        return response()->json($staff);
    }

    /**
     * Provide active customers for dropdown select in appointment forms.
     */
    public function customerOptions(): JsonResponse
    {
        $customers = Customer::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'mobile', 'email', 'gender']);

        return response()->json($customers);
    }
}
