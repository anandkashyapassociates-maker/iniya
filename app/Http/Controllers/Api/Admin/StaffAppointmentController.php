<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffAppointmentController extends Controller
{
    /**
     * List appointment sessions assigned to the logged-in staff member.
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

        // Query directly on appointment_sessions assigned to this staff member
        $query = AppointmentSession::where('staff_id', $staffId)->with([
            'masterAppointment' => function ($q) {
                $q->with([
                    'customer:id,name,email,mobile,gender,age,address,image',
                    'salesTeam:id,sales_code,name',
                    'admin:id,name,email',
                ]);
            },
            'service:id,service_category_id,name,price',
            'service.category:id,name',
            'inventoryProduct:id,product_name,business_unit',
        ]);

        // 1. Search keyword
        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('treatment_details', 'like', "%{$search}%")
                    ->orWhere('session_time', 'like', "%{$search}%")
                    ->orWhereHas('service', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('masterAppointment', function ($mq) use ($search) {
                        $mq->where('appointment_number', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%")
                                    ->orWhere('mobile', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // 2. Date Filtering (applied to session_date)
        $today = Carbon::today()->toDateString();
        $dateFilter = $request->input('date');

        if ($dateFilter === 'today') {
            $query->whereDate('session_date', $today);
        } elseif ($dateFilter === 'upcoming') {
            $query->whereDate('session_date', '>=', $today);
        } elseif ($dateFilter === 'past') {
            $query->whereDate('session_date', '<', $today);
        } elseif ($dateFilter && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
            $query->whereDate('session_date', $dateFilter);
        }

        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('session_date', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('session_date', '<=', $toDate);
        }

        // 3. Status Filtering
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, AppointmentSession::ALL_STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        // Summary Statistics for logged-in staff member
        $staffSessions = AppointmentSession::where('staff_id', $staffId);
        $totalSessionsCount = (clone $staffSessions)->count();
        $todaySessionsCount = (clone $staffSessions)->whereDate('session_date', $today)->count();
        $pendingSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_PENDING)->count();
        $completedSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $inProgressSessionsCount = (clone $staffSessions)->where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $totalCommissionEarned = (float) (clone $staffSessions)->sum('staff_commission');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->orderBy('session_date', 'desc')
            ->orderBy('session_time', 'asc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json([
            'sessions' => $paginated,
            'appointments' => $paginated, // backward-compatibility alias
            'summary' => [
                'total_sessions' => $totalSessionsCount,
                'total_appointments' => $totalSessionsCount,
                'today_sessions' => $todaySessionsCount,
                'pending_sessions' => $pendingSessionsCount,
                'completed_sessions' => $completedSessionsCount,
                'in_progress_sessions' => $inProgressSessionsCount,
                'total_commission_earned' => $totalCommissionEarned,
            ],
        ]);
    }

    /**
     * Show single appointment session details for the staff member.
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

        // Find the session directly assigned to this staff member
        $session = AppointmentSession::where('staff_id', $staffId)
            ->with([
                'masterAppointment' => function ($q) {
                    $q->with([
                        'customer:id,name,email,mobile,gender,age,address,image',
                        'salesTeam:id,sales_code,name,department,mobile',
                        'admin:id,name,email',
                        'sessions' => function ($sq) {
                            $sq->with([
                                'staff:id,staff_code,name,department,designation,mobile',
                                'service:id,service_category_id,name,price',
                                'service.category:id,name',
                                'inventoryProduct:id,product_name,business_unit',
                            ])->orderBy('session_number');
                        },
                    ]);
                },
                'service:id,service_category_id,name,price',
                'service.category:id,name',
                'inventoryProduct:id,product_name,business_unit',
                'rescheduleHistories',
            ])
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                    ->orWhere('master_appointment_id', $id);
            })
            ->first();

        if (! $session) {
            return response()->json([
                'message' => 'Appointment session record not found or you are not assigned to it.',
            ], 404);
        }

        return response()->json([
            'session' => $session,
            'appointment' => $session->masterAppointment,
        ]);
    }

    /**
     * Update session status for staff member (pending, in_progress, completed, cancelled).
     */
    public function updateStatus(Request $request, string|int $id): JsonResponse
    {
        $user = $request->user();

        if (! ($user instanceof Staff)) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $session = AppointmentSession::where('staff_id', $user->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                    ->orWhere('master_appointment_id', $id);
            })
            ->first();

        if (! $session) {
            return response()->json([
                'message' => 'Appointment session record not found or you are not assigned to it.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(AppointmentSession::ALL_STATUSES)],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_date' => ['nullable', 'date'],
            'payment_mode' => ['nullable', 'string', 'max:50'],
            'payment_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $updateData = [
            'status' => $validated['status'],
        ];

        if (array_key_exists('payment_amount', $validated) && $validated['payment_amount'] !== null && $validated['payment_amount'] !== '') {
            $updateData['payment_amount'] = (float) $validated['payment_amount'];
            $updateData['payment_date'] = $validated['payment_date'] ?? Carbon::today()->toDateString();
            $updateData['payment_mode'] = $validated['payment_mode'] ?? 'cash';
            if (array_key_exists('payment_notes', $validated)) {
                $updateData['payment_notes'] = $validated['payment_notes'];
            }
        }

        $session->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Session status updated to '{$validated['status']}' successfully.",
            'session' => $session->fresh([
                'service:id,service_category_id,name,price',
                'service.category:id,name',
                'inventoryProduct:id,product_name,business_unit',
                'masterAppointment.customer',
            ]),
        ]);
    }

    /**
     * Upload or update clinical session photo for staff member.
     */
    public function uploadImage(Request $request, string|int $id): JsonResponse
    {
        $user = $request->user();

        if (! ($user instanceof Staff)) {
            return response()->json([
                'message' => 'Access restricted to staff members only.',
            ], 403);
        }

        $session = AppointmentSession::where('staff_id', $user->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                    ->orWhere('master_appointment_id', $id);
            })
            ->first();

        if (! $session) {
            return response()->json([
                'message' => 'Appointment session record not found or you are not assigned to it.',
            ], 404);
        }

        $sessionImagePath = null;

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            ]);

            if ($session->image && Storage::disk('public')->exists($session->image)) {
                Storage::disk('public')->delete($session->image);
            }
            $sessionImagePath = $request->file('image')->store('appointment_sessions', 'public');
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
                    $sessionImagePath = $fileName;
                }
            }
        }

        if (! $sessionImagePath) {
            return response()->json([
                'message' => 'Please provide a valid image file.',
            ], 422);
        }

        $session->update([
            'image' => $sessionImagePath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session clinical photo uploaded successfully.',
            'image' => $session->image,
            'image_url' => $session->image_url,
            'session' => $session->fresh([
                'service:id,service_category_id,name,price',
                'service.category:id,name',
                'inventoryProduct:id,product_name,business_unit',
                'masterAppointment.customer',
            ]),
        ]);
    }
}
