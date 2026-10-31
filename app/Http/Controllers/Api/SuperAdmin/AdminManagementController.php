<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminManagementController extends Controller
{
    /**
     * Display a listing of Admins.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Admin::with('superAdmin:id,name,email');

        // Search by name, email, or mobile
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Filter by status (active, inactive, blocked, or legacy boolean)
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

        $sortBy = in_array($request->input('sort_by'), ['id', 'name', 'email', 'mobile', 'status', 'is_active', 'created_at', 'updated_at'])
            ? $request->input('sort_by')
            : 'created_at';
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');

        $perPage = min((int) $request->input('per_page', 10), 50);
        $admins = $query->paginate($perPage);

        return response()->json($admins);
    }

    /**
     * Store a newly created Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admins,email'],
            'mobile' => ['required', 'string', 'min:7', 'max:20', 'unique:admins,mobile'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if ($request->has('password_confirmation')) {
            $rules['password'] = ['required', 'string', 'confirmed', Password::min(8)];
        } else {
            $rules['password'] = ['required', 'string', Password::min(8)];
        }

        $validated = $request->validate($rules);

        $status = $validated['status'] ?? (isset($validated['is_active']) ? ($validated['is_active'] ? 'active' : 'inactive') : 'active');
        $isActive = ($status === 'active');

        $superAdmin = $request->user();

        $admin = Admin::create([
            'super_admin_id' => $superAdmin->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'],
            'status' => $status,
            'password' => Hash::make($validated['password']),
            'is_active' => $isActive,
            'email_verified_at' => Carbon::now(),
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_created',
            "Super Admin '{$superAdmin->name}' created Admin '{$admin->name}' ({$admin->email}).",
            $request
        );

        return response()->json([
            'message' => 'Admin account created successfully.',
            'admin' => $admin->load('superAdmin:id,name,email'),
        ], 201);
    }

    /**
     * Display the specified Admin.
     */
    public function show(string $id): JsonResponse
    {
        $admin = Admin::with('superAdmin:id,name,email')->find($id);

        if (! $admin) {
            return response()->json([
                'message' => 'Admin account not found.',
            ], 404);
        }

        return response()->json([
            'admin' => $admin,
        ]);
    }

    /**
     * Update the specified Admin.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json([
                'message' => 'Admin account not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('admins')->ignore($admin->id)],
            'mobile' => ['nullable', 'string', 'min:7', 'max:20', Rule::unique('admins')->ignore($admin->id)],
            'password' => ['nullable', 'string', Password::min(8)],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $dataToUpdate = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (array_key_exists('mobile', $validated)) {
            $dataToUpdate['mobile'] = $validated['mobile'];
        }

        if (isset($validated['status'])) {
            $dataToUpdate['status'] = $validated['status'];
            $dataToUpdate['is_active'] = ($validated['status'] === 'active');
        } elseif (isset($validated['is_active'])) {
            $dataToUpdate['is_active'] = $validated['is_active'];
            $dataToUpdate['status'] = $validated['is_active'] ? 'active' : ($admin->status === 'blocked' ? 'blocked' : 'inactive');
        }

        if (! empty($validated['password'])) {
            $dataToUpdate['password'] = Hash::make($validated['password']);
            // Revoke current sessions if password updated
            $admin->tokens()->delete();
        }

        // If admin is marked inactive or blocked, revoke all active sessions immediately
        if (isset($dataToUpdate['is_active']) && ! $dataToUpdate['is_active']) {
            $admin->tokens()->delete();
        }

        $admin->update($dataToUpdate);

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_updated',
            "Super Admin '{$superAdmin->name}' updated Admin '{$admin->name}' details (Status: {$admin->status}).",
            $request
        );

        return response()->json([
            'message' => 'Admin account updated successfully.',
            'admin' => $admin->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Update the active/blocked status of an Admin.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json([
                'message' => 'Admin account not found.',
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

        $admin->update([
            'status' => $status,
            'is_active' => $isActive,
        ]);

        // If deactivated or blocked, revoke all active tokens immediately
        if (! $isActive) {
            $admin->tokens()->delete();
        }

        $superAdmin = $request->user();
        $statusText = match ($status) {
            'blocked' => 'blocked',
            'inactive' => 'deactivated',
            default => 'activated',
        };

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_status_changed',
            "Super Admin '{$superAdmin->name}' {$statusText} Admin '{$admin->name}'.",
            $request
        );

        return response()->json([
            'message' => "Admin account {$statusText} successfully.",
            'admin' => $admin->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Reset an Admin's password by Super Admin.
     */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json([
                'message' => 'Admin account not found.',
            ], 404);
        }

        $validated = $request->validate([
            'password' => ['nullable', 'string', Password::min(8)],
            'generate_random' => ['nullable', 'boolean'],
        ]);

        $newPassword = $validated['password'] ?? null;
        $isGenerated = false;

        if (empty($newPassword)) {
            // Generate a secure 12-char temporary password
            $newPassword = Str::password(12, true, true, false, false);
            $isGenerated = true;
        }

        $admin->update([
            'password' => Hash::make($newPassword),
        ]);

        // Invalidate all tokens for this admin
        $admin->tokens()->delete();

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_password_reset_by_superadmin',
            "Super Admin '{$superAdmin->name}' reset the password for Admin '{$admin->name}'.",
            $request
        );

        return response()->json([
            'message' => 'Admin password has been reset successfully.',
            'temporary_password' => $newPassword,
            'is_generated' => $isGenerated,
        ]);
    }

    /**
     * Impersonate / Log in as an Admin by Super Admin.
     */
    public function impersonate(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json([
                'message' => 'Admin account not found.',
            ], 404);
        }

        if ($admin->status === 'blocked') {
            return response()->json([
                'message' => 'Cannot log in as a blocked Admin account. Please unblock the admin first.',
            ], 422);
        }

        if (! $admin->is_active || $admin->status === 'inactive') {
            return response()->json([
                'message' => 'Cannot log in as an inactive Admin account. Please activate the admin first.',
            ], 422);
        }

        $superAdmin = $request->user();

        // Generate Sanctum access token for the admin with role:admin ability
        $token = $admin->createToken('admin-impersonate-token', ['role:admin'])->plainTextToken;

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_impersonation',
            "Super Admin '{$superAdmin->name}' logged in as Admin '{$admin->name}' (ID: {$admin->id}).",
            $request
        );

        return response()->json([
            'message' => "Successfully authenticated as Admin '{$admin->name}'.",
            'token' => $token,
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'mobile' => $admin->mobile,
                'status' => $admin->status,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
            ],
            'impersonated_by' => [
                'superadmin_id' => $superAdmin->id,
                'superadmin_name' => $superAdmin->name,
                'superadmin_email' => $superAdmin->email,
            ],
        ]);
    }
}
