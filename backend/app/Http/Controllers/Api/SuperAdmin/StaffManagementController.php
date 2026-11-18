<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffManagementController extends Controller
{
    /**
     * Display a listing of Staff members with search, department/status filter, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Staff::with([
            'superAdmin:id,name,email',
            'clinic:id,clinic_code,name,branch_name,location,city,address,phone',
        ]);

        // Search by staff_code, name, email, or mobile
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('staff_code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Filter by clinic
        if ($clinicId = $request->input('clinic_id')) {
            if ($clinicId !== '' && $clinicId !== 'all') {
                $query->where('clinic_id', $clinicId);
            }
        }

        // Filter by department
        if ($department = $request->input('department')) {
            if ($department !== '' && $department !== 'all') {
                $query->where('department', $department);
            }
        }

        // Filter by employment type
        if ($empType = $request->input('employment_type')) {
            if ($empType !== '' && $empType !== 'all') {
                $query->where('employment_type', $empType);
            }
        }

        // Filter by status (active, inactive, blocked, or boolean true/false)
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $statusInput = $request->input('status');
            if (in_array($statusInput, ['active', 'inactive', 'blocked'])) {
                $query->where('status', $statusInput);
            } elseif ($statusInput === 'true' || $statusInput === '1') {
                $query->where('is_active', true);
            } elseif ($statusInput === 'false' || $statusInput === '0') {
                $query->where('is_active', false);
            }
        }

        // Sorting
        $allowedSorts = [
            'id', 'staff_code', 'name', 'email', 'mobile',
            'department', 'designation', 'employment_type',
            'joining_date', 'status', 'is_active', 'created_at', 'updated_at',
        ];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts)
            ? $request->input('sort_by')
            : 'created_at';
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');

        $perPage = min((int) $request->input('per_page', 10), 50);
        $staff = $query->paginate($perPage);

        return response()->json($staff);
    }

    /**
     * Preview the next available Staff Code.
     */
    public function previewCode(): JsonResponse
    {
        $code = Staff::generateUniqueCode();

        return response()->json([
            'preview_code' => $code,
        ]);
    }

    /**
     * Get distinct departments for filter dropdowns.
     */
    public function departments(): JsonResponse
    {
        $departments = Staff::whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department');

        return response()->json($departments);
    }

    /**
     * Store a newly created Staff member.
     */
    public function store(Request $request): JsonResponse
    {
        $photoRules = $request->hasFile('profile_photo') || $request->hasFile('image')
            ? ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120']
            : ['nullable', 'string'];

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:staff,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'mobile' => ['nullable', 'string', 'min:7', 'max:25'],
            'department' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:1000'],
            'profile_photo' => $photoRules,
            'image' => $photoRules,
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $photoPath = null;
        if ($request->hasFile('profile_photo')) {
            $photoPath = $request->file('profile_photo')->store('staff', 'public');
        } elseif ($request->hasFile('image')) {
            $photoPath = $request->file('image')->store('staff', 'public');
        } elseif ($request->filled('profile_photo') && str_starts_with($request->input('profile_photo'), 'data:image')) {
            $dataUri = $request->input('profile_photo');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'staff/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $photoPath = $fileName;
                }
            }
        } elseif ($request->filled('image') && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'staff/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $photoPath = $fileName;
                }
            }
        } elseif (isset($validated['profile_photo']) && is_string($validated['profile_photo']) && strlen($validated['profile_photo']) < 255) {
            $photoPath = $validated['profile_photo'];
        }

        $status = $validated['status'] ?? (isset($validated['is_active']) ? ($validated['is_active'] ? 'active' : 'inactive') : 'active');
        $isActive = ($status === 'active');

        $superAdmin = $request->user();

        // Concurrency-safe backend generated Staff Code
        $staffCode = Staff::generateUniqueCode();
        $plainPassword = ! empty($validated['password']) ? $validated['password'] : '12345678';
        $clinicId = $validated['clinic_id'] ?? \App\Models\Clinic::orderBy('id')->value('id');

        $staff = Staff::create([
            'staff_code' => $staffCode,
            'clinic_id' => $clinicId,
            'created_by_superadmin_id' => $superAdmin->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($plainPassword),
            'mobile' => $validated['mobile'] ?? null,
            'department' => $validated['department'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'employment_type' => $validated['employment_type'] ?? 'Full-Time',
            'joining_date' => $validated['joining_date'] ?? null,
            'address' => $validated['address'] ?? null,
            'profile_photo' => $photoPath,
            'status' => $status,
            'is_active' => $isActive,
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_created',
            "Super Admin '{$superAdmin->name}' created Staff '{$staff->name}' ({$staff->staff_code}) assigned to Clinic ID {$staff->clinic_id}.",
            $request
        );

        return response()->json([
            'message' => 'Staff member created successfully.',
            'staff' => $staff->load([
                'superAdmin:id,name,email',
                'clinic:id,clinic_code,name,branch_name,location,city,address,phone',
            ]),
        ], 201);
    }

    /**
     * Display the specified Staff member.
     */
    public function show(string $id): JsonResponse
    {
        $staff = Staff::with([
            'superAdmin:id,name,email',
            'clinic:id,clinic_code,name,branch_name,location,city,address,phone',
        ])->find($id);

        if (! $staff) {
            return response()->json([
                'message' => 'Staff member not found.',
            ], 404);
        }

        return response()->json([
            'staff' => $staff,
        ]);
    }

    /**
     * Update the specified Staff member.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $staff = Staff::find($id);

        if (! $staff) {
            return response()->json([
                'message' => 'Staff member not found.',
            ], 404);
        }

        $photoRules = $request->hasFile('profile_photo') || $request->hasFile('image')
            ? ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120']
            : ['nullable', 'string'];

        $validated = $request->validate([
            'clinic_id' => ['sometimes', 'nullable', 'integer', 'exists:clinics,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('staff')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['nullable', 'string'],
            'mobile' => ['nullable', 'string', 'min:7', 'max:25'],
            'department' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:1000'],
            'profile_photo' => $photoRules,
            'image' => $photoRules,
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'New password and confirm password do not match.',
        ]);

        $dataToUpdate = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (array_key_exists('clinic_id', $validated) && $validated['clinic_id']) {
            $dataToUpdate['clinic_id'] = $validated['clinic_id'];
        }

        $passwordChanged = false;
        if (! empty($validated['password'])) {
            $dataToUpdate['password'] = Hash::make($validated['password']);
            $passwordChanged = true;
            // Revoke active sessions if password is changed
            $staff->tokens()->delete();
        }

        foreach (['mobile', 'department', 'designation', 'employment_type', 'joining_date', 'address'] as $field) {
            if (array_key_exists($field, $validated)) {
                $dataToUpdate[$field] = $validated[$field];
            }
        }

        // Handle photo file upload or data URL or string
        if ($request->hasFile('profile_photo')) {
            if ($staff->profile_photo && Storage::disk('public')->exists($staff->profile_photo)) {
                Storage::disk('public')->delete($staff->profile_photo);
            }
            $dataToUpdate['profile_photo'] = $request->file('profile_photo')->store('staff', 'public');
        } elseif ($request->hasFile('image')) {
            if ($staff->profile_photo && Storage::disk('public')->exists($staff->profile_photo)) {
                Storage::disk('public')->delete($staff->profile_photo);
            }
            $dataToUpdate['profile_photo'] = $request->file('image')->store('staff', 'public');
        } elseif ($request->filled('profile_photo') && str_starts_with($request->input('profile_photo'), 'data:image')) {
            $dataUri = $request->input('profile_photo');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    if ($staff->profile_photo && Storage::disk('public')->exists($staff->profile_photo)) {
                        Storage::disk('public')->delete($staff->profile_photo);
                    }
                    $fileName = 'staff/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $dataToUpdate['profile_photo'] = $fileName;
                }
            }
        } elseif ($request->filled('image') && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    if ($staff->profile_photo && Storage::disk('public')->exists($staff->profile_photo)) {
                        Storage::disk('public')->delete($staff->profile_photo);
                    }
                    $fileName = 'staff/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $dataToUpdate['profile_photo'] = $fileName;
                }
            }
        } elseif (array_key_exists('profile_photo', $validated) && is_string($validated['profile_photo']) && strlen($validated['profile_photo']) < 255) {
            $dataToUpdate['profile_photo'] = $validated['profile_photo'];
        } elseif ($request->boolean('remove_photo') || ($request->has('profile_photo') && is_null($request->input('profile_photo')))) {
            if ($staff->profile_photo && Storage::disk('public')->exists($staff->profile_photo)) {
                Storage::disk('public')->delete($staff->profile_photo);
            }
            $dataToUpdate['profile_photo'] = null;
        }

        if (isset($validated['status'])) {
            $dataToUpdate['status'] = $validated['status'];
            $dataToUpdate['is_active'] = ($validated['status'] === 'active');
        } elseif (isset($validated['is_active'])) {
            $dataToUpdate['is_active'] = $validated['is_active'];
            $dataToUpdate['status'] = $validated['is_active'] ? 'active' : ($staff->status === 'blocked' ? 'blocked' : 'inactive');
        }

        $staff->update($dataToUpdate);

        $superAdmin = $request->user();
        $pwdLogNote = $passwordChanged ? ' with password change' : '';
        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_updated',
            "Super Admin '{$superAdmin->name}' updated Staff '{$staff->name}' ({$staff->staff_code}) details{$pwdLogNote}.",
            $request
        );

        $successMsg = $passwordChanged
            ? "Staff member '{$staff->name}' details & password updated successfully."
            : 'Staff member updated successfully.';

        return response()->json([
            'message' => $successMsg,
            'staff' => $staff->fresh()->load([
                'superAdmin:id,name,email',
                'clinic:id,clinic_code,name,branch_name,location,city,address,phone',
            ]),
        ]);
    }

    /**
     * Update the active/blocked status of a Staff member.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $staff = Staff::find($id);

        if (! $staff) {
            return response()->json([
                'message' => 'Staff member not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['status'])) {
            $status = $validated['status'];
            $isActive = ($status === 'active');
        } elseif (isset($validated['is_active'])) {
            $isActive = (bool) $validated['is_active'];
            $status = $isActive ? 'active' : 'inactive';
        } else {
            return response()->json([
                'message' => 'Status or is_active field is required.',
            ], 422);
        }

        $staff->update([
            'status' => $status,
            'is_active' => $isActive,
        ]);

        $superAdmin = $request->user();
        $statusText = match ($status) {
            'blocked' => 'blocked',
            'inactive' => 'deactivated',
            default => 'activated',
        };

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_status_changed',
            "Super Admin '{$superAdmin->name}' {$statusText} Staff '{$staff->name}' ({$staff->staff_code}).",
            $request
        );

        return response()->json([
            'message' => "Staff member {$statusText} successfully.",
            'staff' => $staff->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Impersonate / Log in as a Staff member by Super Admin.
     */
    public function impersonate(Request $request, string $id): JsonResponse
    {
        $staff = Staff::find($id);

        if (! $staff) {
            return response()->json([
                'message' => 'Staff member not found.',
            ], 404);
        }

        if ($staff->status === 'blocked') {
            return response()->json([
                'message' => 'Cannot log in as a blocked Staff account. Please unblock the staff member first.',
            ], 422);
        }

        if (! $staff->is_active || $staff->status === 'inactive') {
            return response()->json([
                'message' => 'Cannot log in as an inactive Staff account. Please activate the staff member first.',
            ], 422);
        }

        $superAdmin = $request->user();

        // Generate Sanctum access token for the staff with role:staff ability
        $token = $staff->createToken('staff-impersonate-token', ['role:staff'])->plainTextToken;

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'staff_impersonation',
            "Super Admin '{$superAdmin->name}' logged in as Staff '{$staff->name}' (ID: {$staff->id}, Code: {$staff->staff_code}).",
            $request
        );

        $staff->loadMissing('clinic');

        return response()->json([
            'message' => "Successfully authenticated as Staff '{$staff->name}'.",
            'token' => $token,
            'user' => [
                'id' => $staff->id,
                'staff_code' => $staff->staff_code,
                'name' => $staff->name,
                'email' => $staff->email,
                'mobile' => $staff->mobile,
                'clinic_id' => $staff->clinic_id,
                'clinic' => $staff->clinic ? [
                    'id' => $staff->clinic->id,
                    'clinic_code' => $staff->clinic->clinic_code,
                    'name' => $staff->clinic->name,
                    'branch_name' => $staff->clinic->branch_name,
                    'location' => $staff->clinic->location,
                    'address' => $staff->clinic->address,
                    'city' => $staff->clinic->city,
                    'state' => $staff->clinic->state,
                    'postal_code' => $staff->clinic->postal_code,
                    'phone' => $staff->clinic->phone,
                    'email' => $staff->clinic->email,
                    'status' => $staff->clinic->status,
                ] : null,
                'department' => $staff->department,
                'designation' => $staff->designation,
                'employment_type' => $staff->employment_type,
                'profile_photo' => $staff->profile_photo,
                'image' => $staff->profile_photo,
                'image_url' => $staff->image_url,
                'status' => $staff->status,
                'is_active' => $staff->is_active,
                'last_login_at' => $staff->last_login_at,
                'created_at' => $staff->created_at,
                'role' => 'staff',
                'user_type' => 'staff',
            ],
            'impersonated_by' => [
                'superadmin_id' => $superAdmin->id,
                'superadmin_name' => $superAdmin->name,
                'superadmin_email' => $superAdmin->email,
            ],
        ]);
    }
}
