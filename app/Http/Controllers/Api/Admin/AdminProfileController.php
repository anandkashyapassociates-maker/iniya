<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminProfileController extends Controller
{
    /**
     * Update Admin or Staff profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof Staff) {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique('staff')->ignore($user->id)],
                'mobile' => ['nullable', 'string', 'max:25'],
            ]);

            $user->update($validated);

            AdminActivityLog::record(
                'staff',
                $user->id,
                'staff_profile_updated',
                "Staff '{$user->name}' updated their profile information.",
                $request
            );

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => [
                    'id' => $user->id,
                    'staff_code' => $user->staff_code,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'department' => $user->department,
                    'designation' => $user->designation,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'role' => 'staff',
                    'user_type' => 'staff',
                ],
            ]);
        }

        $admin = $user;

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
                'user_type' => 'admin',
            ],
        ]);
    }

    /**
     * Change Admin or Staff password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The provided current password does not match our records.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $actorType = ($user instanceof Staff) ? 'staff' : 'admin';
        AdminActivityLog::record(
            $actorType,
            $user->id,
            $actorType.'_password_changed',
            ucfirst($actorType)." '{$user->name}' changed their account password.",
            $request
        );

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
