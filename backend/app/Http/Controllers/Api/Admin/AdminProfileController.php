<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminProfileController extends Controller
{
    /**
     * Update Admin profile.
     */
    public function update(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('admins')->ignore($admin->id)],
        ]);

        $admin->update($validated);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'admin_profile_updated',
            "Admin '{$admin->name}' updated their profile information.",
            $request
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
                'role' => 'admin',
            ],
        ]);
    }

    /**
     * Change Admin password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($validated['current_password'], $admin->password)) {
            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The provided current password does not match our records.'],
                ],
            ], 422);
        }

        $admin->update([
            'password' => Hash::make($validated['password']),
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'admin_password_changed',
            "Admin '{$admin->name}' changed their account password.",
            $request
        );

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}

