<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                'image' => ['nullable'],
            ]);

            if ($request->hasFile('image')) {
                $request->validate([
                    'image' => ['file', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
                ]);
                if ($user->profile_photo && ! str_starts_with($user->profile_photo, 'http') && Storage::disk('public')->exists($user->profile_photo)) {
                    Storage::disk('public')->delete($user->profile_photo);
                }
                $validated['profile_photo'] = $request->file('image')->store('staff', 'public');
            } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
                $dataUri = $request->input('image');
                if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                    $data = substr($dataUri, strpos($dataUri, ',') + 1);
                    $type = strtolower($type[1]);
                    $data = base64_decode($data);
                    if ($data !== false) {
                        if ($user->profile_photo && ! str_starts_with($user->profile_photo, 'http') && Storage::disk('public')->exists($user->profile_photo)) {
                            Storage::disk('public')->delete($user->profile_photo);
                        }
                        $fileName = 'staff/'.Str::random(40).'.'.$type;
                        Storage::disk('public')->put($fileName, $data);
                        $validated['profile_photo'] = $fileName;
                    }
                }
            }
            unset($validated['image']);

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
                    'image' => $user->profile_photo,
                    'image_url' => $user->image_url,
                    'status' => $user->status,
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
            'mobile' => ['nullable', 'string', 'max:25'],
            'image' => ['nullable'],
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            ]);
            if ($admin->image && ! str_starts_with($admin->image, 'http') && Storage::disk('public')->exists($admin->image)) {
                Storage::disk('public')->delete($admin->image);
            }
            $validated['image'] = $request->file('image')->store('admins', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    if ($admin->image && ! str_starts_with($admin->image, 'http') && Storage::disk('public')->exists($admin->image)) {
                        Storage::disk('public')->delete($admin->image);
                    }
                    $fileName = 'admins/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $validated['image'] = $fileName;
                }
            }
        } elseif (! array_key_exists('image', $validated)) {
            unset($validated['image']);
        }

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
                'mobile' => $admin->mobile,
                'image' => $admin->image,
                'image_url' => $admin->image_url,
                'status' => $admin->status,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
                'role' => 'Administrator',
            ],
        ]);
    }

    /**
     * Upload admin avatar image directly.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
        ]);

        if ($user instanceof Staff) {
            if ($user->profile_photo && ! str_starts_with($user->profile_photo, 'http') && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $path = $request->file('image')->store('staff', 'public');

            $user->update([
                'profile_photo' => $path,
            ]);

            AdminActivityLog::record(
                'staff',
                $user->id,
                'staff_avatar_updated',
                "Staff '{$user->name}' updated their profile avatar.",
                $request
            );

            return response()->json([
                'message' => 'Avatar updated successfully.',
                'image' => $user->profile_photo,
                'image_url' => $user->image_url,
                'user' => [
                    'id' => $user->id,
                    'staff_code' => $user->staff_code,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'department' => $user->department,
                    'designation' => $user->designation,
                    'image' => $user->profile_photo,
                    'image_url' => $user->image_url,
                    'status' => $user->status,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'role' => 'staff',
                    'user_type' => 'staff',
                ],
            ]);
        }

        $admin = $user;

        if ($admin->image && ! str_starts_with($admin->image, 'http') && Storage::disk('public')->exists($admin->image)) {
            Storage::disk('public')->delete($admin->image);
        }

        $path = $request->file('image')->store('admins', 'public');

        $admin->update([
            'image' => $path,
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'admin_avatar_updated',
            "Admin '{$admin->name}' updated their profile avatar.",
            $request
        );

        return response()->json([
            'message' => 'Avatar updated successfully.',
            'image' => $admin->image,
            'image_url' => $admin->image_url,
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'mobile' => $admin->mobile,
                'image' => $admin->image,
                'image_url' => $admin->image_url,
                'status' => $admin->status,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
                'role' => 'Administrator',
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
