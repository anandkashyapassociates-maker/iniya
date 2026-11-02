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

            // 1. Create reschedule history record
            $history = AppointmentRescheduleHistory::create([
                'session_id' => $session->id,
                'old_date' => $oldDate,
                'old_time' => $oldTime,
                'old_staff_id' => $oldStaffId,
                'new_date' => $validated['session_date'],
                'new_time' => $validated['session_time'],
                'new_staff_id' => $validated['staff_id'],
                'reschedule_reason' => $validated['reschedule_reason'] ?? null,
                'rescheduled_by' => $adminName,
                'created_at' => Carbon::now(),
            ]);

            // 2. Update session with ONLY new date, new time, and new staff
            $session->update([
                'session_date' => $validated['session_date'],
                'session_time' => $validated['session_time'],
                'staff_id' => $validated['staff_id'],
            ]);

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
