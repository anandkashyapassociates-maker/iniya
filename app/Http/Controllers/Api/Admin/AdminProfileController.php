<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
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
     * Update Admin profile.
     */
    public function update(Request $request): JsonResponse
    {
        $admin = $request->user();

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
        $admin = $request->user();

        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
        ]);

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
