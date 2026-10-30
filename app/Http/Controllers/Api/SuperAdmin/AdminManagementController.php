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

        // Search by name or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by active status
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $isActive = filter_var($request->input('status'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        $perPage = min((int) $request->input('per_page', 10), 50);
        $admins = $query->latest()->paginate($perPage);

        return response()->json($admins);
    }

    /**
     * Store a newly created Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admins,email'],
            'password' => ['required', 'string', Password::min(8)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $superAdmin = $request->user();

        $admin = Admin::create([
            'super_admin_id' => $superAdmin->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
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
            'password' => ['nullable', 'string', Password::min(8)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $dataToUpdate = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (isset($validated['is_active'])) {
            $dataToUpdate['is_active'] = $validated['is_active'];
        }

        if (! empty($validated['password'])) {
            $dataToUpdate['password'] = Hash::make($validated['password']);
            // Revoke current sessions if password updated
            $admin->tokens()->delete();
        }

        $admin->update($dataToUpdate);

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_updated',
            "Super Admin '{$superAdmin->name}' updated Admin '{$admin->name}' details.",
            $request
        );

        return response()->json([
            'message' => 'Admin account updated successfully.',
            'admin' => $admin->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Update the active status of an Admin.
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
            'is_active' => ['required', 'boolean'],
        ]);

        $admin->update([
            'is_active' => $validated['is_active'],
        ]);

        // If deactivated, revoke all active tokens immediately
        if (! $validated['is_active']) {
            $admin->tokens()->delete();
        }

        $superAdmin = $request->user();
        $statusText = $validated['is_active'] ? 'activated' : 'deactivated';

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'admin_status_changed',
            "Super Admin '{$superAdmin->name}' {$statusText} Admin '{$admin->name}'.",
            $request
        );

        return response()->json([
            'message' => "Admin account {$statusText} successfully.",
            'admin' => $admin,
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
}

