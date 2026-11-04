<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentRescheduleHistory;
use App\Models\AppointmentSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SessionRescheduleController extends Controller
{
    /**
     * Reschedule an individual appointment session.
     * STRICT BUSINESS RULES:
     * - Only pending sessions can be rescheduled.
     * - In Progress, Completed, and Cancelled sessions are strictly prohibited.
     * - Concurrency safe with row locking (lockForUpdate).
     * - Audit trail saved in appointment_reschedule_history table.
     * - Master Appointment date, fees, customer, sales team remain unchanged.
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'session_date' => ['required', 'date', 'after_or_equal:today'],
            'session_time' => ['required', 'string', 'max:20'],
            'staff_id' => ['required', 'exists:staff,id'],
            'staff_commission' => ['nullable', 'numeric', 'min:0'],
            'inventory_product_id' => ['nullable'],
            'inventory_product_ids' => ['nullable', 'array'],
            'inventory_product_ids.*' => ['integer', 'exists:inventory_products,id'],
            'reschedule_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        // Validate that new time for today is not in the past (with a 5-minute grace buffer)
        $today = Carbon::today()->toDateString();
        $now = Carbon::now()->subMinutes(5);
        if ($validated['session_date'] === $today) {
            try {
                $candidateDateTime = Carbon::parse("{$today} ".trim((string) $validated['session_time']));
                if ($candidateDateTime->lt($now)) {
                    throw ValidationException::withMessages([
                        'session_time' => ["New session time ({$validated['session_time']}) is in the past for today."],
                    ]);
                }
            } catch (\Exception $e) {
                if ($e instanceof ValidationException) {
                    throw $e;
                }
            }
        }

        $adminName = $request->user()?->name ?? 'Admin';

        // Execute in transaction with row locking
        $result = DB::transaction(function () use ($id, $validated, $adminName) {
            /** @var AppointmentSession $session */
            $session = AppointmentSession::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            // STRICT STATUS ENFORCEMENT
            if ($session->status !== AppointmentSession::STATUS_PENDING) {
                $statusLabel = ucfirst(str_replace('_', ' ', $session->status));
                throw ValidationException::withMessages([
                    'status' => ["Only 'Pending' sessions can be rescheduled. This session is currently '{$statusLabel}', so rescheduling is not allowed."],
                ]);
            }

            // Capture old details for the audit log
            $oldDate = $session->session_date instanceof Carbon
                ? $session->session_date->toDateString()
                : (string) $session->session_date;
            $oldTime = $session->session_time;
            $oldStaffId = $session->staff_id;
            $oldCommission = $session->staff_commission;
            $newCommission = array_key_exists('staff_commission', $validated) && $validated['staff_commission'] !== null
                ? (float) $validated['staff_commission']
                : (float) $session->staff_commission;

            $oldProductIds = ! empty($session->inventory_product_ids)
                ? array_map('intval', (array) $session->inventory_product_ids)
                : (! empty($session->inventory_product_id) ? [(int) $session->inventory_product_id] : []);

            $productIds = ! empty($validated['inventory_product_ids'])
                ? array_map('intval', (array) $validated['inventory_product_ids'])
                : (! empty($validated['inventory_product_id']) ? [(int) $validated['inventory_product_id']] : []);

            $hasProductUpdate = array_key_exists('inventory_product_ids', $validated) || array_key_exists('inventory_product_id', $validated);
            $newProductIds = $hasProductUpdate ? $productIds : $oldProductIds;

            // 1. Create reschedule history record
            $history = AppointmentRescheduleHistory::create([
                'session_id' => $session->id,
                'old_date' => $oldDate,
                'old_time' => $oldTime,
                'old_staff_id' => $oldStaffId,
                'old_commission' => $oldCommission,
                'old_inventory_product_ids' => ! empty($oldProductIds) ? array_values($oldProductIds) : null,
                'new_date' => $validated['session_date'],
                'new_time' => $validated['session_time'],
                'new_staff_id' => $validated['staff_id'],
                'new_commission' => $newCommission,
                'new_inventory_product_ids' => ! empty($newProductIds) ? array_values($newProductIds) : null,
                'reschedule_reason' => $validated['reschedule_reason'] ?? null,
                'rescheduled_by' => $adminName,
                'created_at' => Carbon::now(),
            ]);

            // 2. Update session with new date, new time, new staff, commission, and supplies
            $sessionUpdateData = [
                'session_date' => $validated['session_date'],
                'session_time' => $validated['session_time'],
                'staff_id' => $validated['staff_id'],
                'staff_commission' => $newCommission,
            ];

            if ($hasProductUpdate) {
                $sessionUpdateData['inventory_product_id'] = ! empty($productIds) ? $productIds[0] : null;
                $sessionUpdateData['inventory_product_ids'] = ! empty($productIds) ? $productIds : null;
            }

            $session->update($sessionUpdateData);

            return [
                'session' => $session->fresh(['staff', 'inventoryProduct']),
                'history' => $history->load(['oldStaff', 'newStaff']),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Session rescheduled successfully and history recorded.',
            'data' => $result,
        ]);
    }

    /**
     * Retrieve complete reschedule history for an individual session.
     */
    public function history(int $id): JsonResponse
    {
        $session = AppointmentSession::findOrFail($id);

        $histories = AppointmentRescheduleHistory::where('session_id', $session->id)
            ->with([
                'oldStaff:id,staff_code,name,department',
                'newStaff:id,staff_code,name,department',
            ])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $session->id,
                'session_number' => $session->session_number,
                'histories' => $histories,
            ],
        ]);
    }
}
