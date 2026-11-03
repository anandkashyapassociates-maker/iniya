<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\MasterAppointment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AppointmentSessionController extends Controller
{
    /**
     * Add an individual session to an existing master appointment.
     */
    public function store(Request $request, int $masterAppointmentId): JsonResponse
    {
        $master = MasterAppointment::findOrFail($masterAppointmentId);

        $validated = $request->validate([
            'service_id' => ['nullable', 'exists:services,id'],
            'treatment_details' => ['nullable', 'string', 'max:5000'],
            'session_date' => ['required', 'date', 'after_or_equal:today'],
            'session_time' => ['required', 'string', 'max:20'],
            'staff_id' => ['required', 'exists:staff,id'],
            'staff_commission' => ['required', 'numeric', 'min:0'],
            'inventory_product_id' => ['nullable'],
            'inventory_product_ids' => ['nullable', 'array'],
            'inventory_product_ids.*' => ['integer', 'exists:inventory_products,id'],
            'image' => ['nullable'],
        ]);

        $nextSessionNumber = ($master->sessions()->max('session_number') ?? 0) + 1;

        $productIds = ! empty($validated['inventory_product_ids'])
            ? array_map('intval', (array) $validated['inventory_product_ids'])
            : (! empty($validated['inventory_product_id']) ? [(int) $validated['inventory_product_id']] : []);

        $sessionImagePath = null;
        if ($request->hasFile('image')) {
            $sessionImagePath = $request->file('image')->store('appointment_sessions', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'appointment_sessions/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $sessionImagePath = $fileName;
                }
            }
        }

        $session = AppointmentSession::create([
            'master_appointment_id' => $master->id,
            'session_number' => $nextSessionNumber,
            'service_id' => $validated['service_id'] ?? null,
            'treatment_details' => $validated['treatment_details'] ?? '',
            'image' => $sessionImagePath,
            'session_date' => $validated['session_date'],
            'session_time' => $validated['session_time'],
            'staff_id' => $validated['staff_id'],
            'staff_commission' => $validated['staff_commission'],
            'inventory_product_id' => ! empty($productIds) ? $productIds[0] : null,
            'inventory_product_ids' => ! empty($productIds) ? $productIds : null,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'New session added successfully.',
            'data' => $session->load(['staff', 'inventoryProduct', 'service.category.parent']),
        ], 201);
    }

    /**
     * Update session details (treatment, staff, commission, product).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $session = AppointmentSession::findOrFail($id);

        $validated = $request->validate([
            'service_id' => ['sometimes', 'nullable', 'exists:services,id'],
            'treatment_details' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'session_date' => ['sometimes', 'required', 'date'],
            'session_time' => ['sometimes', 'required', 'string', 'max:20'],
            'staff_id' => ['sometimes', 'required', 'exists:staff,id'],
            'staff_commission' => ['sometimes', 'required', 'numeric', 'min:0'],
            'inventory_product_id' => ['nullable'],
            'inventory_product_ids' => ['nullable', 'array'],
            'inventory_product_ids.*' => ['integer', 'exists:inventory_products,id'],
            'status' => ['sometimes', 'required', Rule::in(AppointmentSession::ALL_STATUSES)],
        ]);

        if (array_key_exists('inventory_product_ids', $validated)) {
            $validated['inventory_product_id'] = ! empty($validated['inventory_product_ids'])
                ? (int) $validated['inventory_product_ids'][0]
                : null;
        }

        if ($request->hasFile('image')) {
            if ($session->image && Storage::disk('public')->exists($session->image)) {
                Storage::disk('public')->delete($session->image);
            }
            $validated['image'] = $request->file('image')->store('appointment_sessions', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    if ($session->image && Storage::disk('public')->exists($session->image)) {
                        Storage::disk('public')->delete($session->image);
                    }
                    $fileName = 'appointment_sessions/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $validated['image'] = $fileName;
                }
            }
        }

        $session->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Session details updated successfully.',
            'data' => $session->fresh(['staff', 'inventoryProduct', 'service.category.parent']),
        ]);
    }

    /**
     * Update session status independently (pending, in_progress, completed, cancelled).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $session = AppointmentSession::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(AppointmentSession::ALL_STATUSES)],
        ]);

        $session->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Session status updated to '{$validated['status']}'.",
            'data' => $session->fresh(['staff', 'inventoryProduct']),
        ]);
    }

    /**
     * Delete an individual session.
     */
    public function destroy(int $id): JsonResponse
    {
        $session = AppointmentSession::findOrFail($id);

        if ($session->image && Storage::disk('public')->exists($session->image)) {
            Storage::disk('public')->delete($session->image);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session deleted successfully.',
        ]);
    }

    /**
     * Calendar view endpoint: fetch all sessions by date range with staff and status filtering.
     */
    public function calendar(Request $request): JsonResponse
    {
        $query = AppointmentSession::with([
            'masterAppointment.customer:id,name,mobile,email',
            'staff:id,staff_code,name,department',
            'inventoryProduct:id,product_name',
            'service:id,name,price',
        ]);

        // Start & End date range (default to current month)
        if ($startDate = $request->input('start_date')) {
            $query->whereDate('session_date', '>=', $startDate);
        } else {
            $query->whereDate('session_date', '>=', Carbon::now()->startOfMonth()->toDateString());
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('session_date', '<=', $endDate);
        } else {
            $query->whereDate('session_date', '<=', Carbon::now()->endOfMonth()->toDateString());
        }

        // Filter by Staff
        if ($staffId = $request->input('staff_id')) {
            $query->where('staff_id', $staffId);
        }

        // Filter by Status
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        $sessions = $query->orderBy('session_date')->orderBy('session_time')->get();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Get receipt data for an individual session.
     */
    public function receipt(Request $request, int $id): JsonResponse
    {
        $session = AppointmentSession::with([
            'masterAppointment.customer',
            'masterAppointment.salesTeam',
            'masterAppointment.admin:id,name,email',
            'staff',
            'inventoryProduct',
            'service.category.parent',
        ])->findOrFail($id);

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'session_receipt_viewed',
                "Admin '{$admin->name}' generated receipt for Session #{$session->session_number} of Master Appointment #{$session->masterAppointment?->appointment_number}.",
                $request
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'receipt_number' => 'RCP-S'.str_pad((string) $session->id, 5, '0', STR_PAD_LEFT),
                'receipt_date' => Carbon::now()->toIso8601String(),
                'session' => $session,
                'appointment' => $session->masterAppointment,
            ],
        ]);
    }
}
