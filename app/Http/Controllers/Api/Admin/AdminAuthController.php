<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use App\Models\Staff;
use App\Services\TurnstileService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AdminAuthController extends Controller
{
    public function __construct(
        protected TurnstileService $turnstileService
    ) {}

    /**
     * Authenticate Admin or Staff and issue Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        if ($request->bearerToken() && $tokenUser = auth('sanctum')->user()) {
            if (($tokenUser instanceof Admin || $tokenUser instanceof Staff) && $tokenUser->is_active && $tokenUser->status !== 'blocked' && $tokenUser->status !== 'inactive') {
                return response()->json([
                    'message' => 'Already authenticated.',
                    'token' => $request->bearerToken(),
                    'user' => $tokenUser,
                ], 200);
            }
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'account_type' => ['nullable', 'string', 'in:admin,staff'],
            'login_type' => ['nullable', 'string', 'in:admin,staff'],
            'turnstile_token' => ['nullable', 'string'],
            'cf_turnstile_response' => ['nullable', 'string'],
        ]);

        $accountType = $validated['account_type'] ?? $validated['login_type'] ?? null;

        $captchaToken = $validated['turnstile_token'] ?? $validated['cf_turnstile_response'] ?? null;
        $verification = $this->turnstileService->verify($captchaToken, $request->ip(), 'admin_login');

        if (! $verification['success']) {
            return response()->json([
                'message' => $verification['message'],
                'errors' => [
                    'captcha' => [$verification['message']],
                ],
            ], 422);
        }

        // 1. Explicit Admin Selection
        if ($accountType === 'admin') {
            $admin = Admin::where('email', $validated['email'])->first();

            if (! $admin || ! Hash::check($validated['password'], $admin->password)) {
                return response()->json([
                    'message' => 'The provided Admin credentials do not match our records.',
                    'errors' => [
                        'email' => ['The provided Admin credentials do not match our records.'],
                    ],
                ], 422);
            }

            if ($admin->status === 'blocked') {
                return response()->json([
                    'message' => 'Your Admin account has been blocked by the Super Administrator. Access denied.',
                ], 403);
            }

            if (! $admin->is_active || $admin->status === 'inactive') {
                return response()->json([
                    'message' => 'Your Admin account is deactivated. Please contact your Super Administrator.',
                ], 403);
            }

            $admin->update([
                'last_login_at' => Carbon::now(),
            ]);

            $token = $admin->createToken('admin-token', ['role:admin'])->plainTextToken;

            AdminActivityLog::record(
                'admin',
                $admin->id,
                'admin_login',
                "Admin '{$admin->name}' logged in successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'status' => $admin->status,
                    'is_active' => $admin->is_active,
                    'last_login_at' => $admin->last_login_at,
                    'created_at' => $admin->created_at,
                    'role' => 'admin',
                    'user_type' => 'admin',
                ],
            ]);
        }

        // 2. Explicit Staff Selection
        if ($accountType === 'staff') {
            $staff = Staff::where('email', $validated['email'])->first();

            if (! $staff || empty($staff->password) || ! Hash::check($validated['password'], $staff->password)) {
                return response()->json([
                    'message' => 'The provided Staff credentials do not match our records.',
                    'errors' => [
                        'email' => ['The provided Staff credentials do not match our records.'],
                    ],
                ], 422);
            }

            if ($staff->status === 'blocked') {
                return response()->json([
                    'message' => 'Your Staff account has been blocked by the Super Administrator. Access denied.',
                ], 403);
            }

            if (! $staff->is_active || $staff->status === 'inactive') {
                return response()->json([
                    'message' => 'Your Staff account is deactivated. Please contact your Super Administrator.',
                ], 403);
            }

            $staff->update([
                'last_login_at' => Carbon::now(),
            ]);

            $token = $staff->createToken('staff-token', ['role:staff'])->plainTextToken;

            AdminActivityLog::record(
                'staff',
                $staff->id,
                'staff_login',
                "Staff '{$staff->name}' ({$staff->staff_code}) logged in successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $staff->id,
                    'staff_code' => $staff->staff_code,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'mobile' => $staff->mobile,
                    'department' => $staff->department,
                    'designation' => $staff->designation,
                    'employment_type' => $staff->employment_type,
                    'image' => $staff->profile_photo,
                    'image_url' => $staff->image_url,
                    'status' => $staff->status,
                    'is_active' => $staff->is_active,
                    'last_login_at' => $staff->last_login_at,
                    'created_at' => $staff->created_at,
                    'role' => 'staff',
                    'user_type' => 'staff',
                ],
            ]);
        }

        // 3. Fallback when account_type is not passed
        $admin = Admin::where('email', $validated['email'])->first();

        if ($admin && Hash::check($validated['password'], $admin->password)) {
            if ($admin->status === 'blocked') {
                return response()->json([
                    'message' => 'Your Admin account has been blocked by the Super Administrator. Access denied.',
                ], 403);
            }

            if (! $admin->is_active || $admin->status === 'inactive') {
                return response()->json([
                    'message' => 'Your Admin account is deactivated. Please contact your Super Administrator.',
                ], 403);
            }

            $admin->update([
                'last_login_at' => Carbon::now(),
            ]);

            $token = $admin->createToken('admin-token', ['role:admin'])->plainTextToken;

            AdminActivityLog::record(
                'admin',
                $admin->id,
                'admin_login',
                "Admin '{$admin->name}' logged in successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'status' => $admin->status,
                    'is_active' => $admin->is_active,
                    'last_login_at' => $admin->last_login_at,
                    'created_at' => $admin->created_at,
                    'role' => 'admin',
                    'user_type' => 'admin',
                ],
            ]);
        }

        $staff = Staff::where('email', $validated['email'])->first();

        if ($staff && ! empty($staff->password) && Hash::check($validated['password'], $staff->password)) {
            if ($staff->status === 'blocked') {
                return response()->json([
                    'message' => 'Your Staff account has been blocked by the Super Administrator. Access denied.',
                ], 403);
            }

            if (! $staff->is_active || $staff->status === 'inactive') {
                return response()->json([
                    'message' => 'Your Staff account is deactivated. Please contact your Super Administrator.',
                ], 403);
            }

            $staff->update([
                'last_login_at' => Carbon::now(),
            ]);

            $token = $staff->createToken('staff-token', ['role:staff'])->plainTextToken;

            AdminActivityLog::record(
                'staff',
                $staff->id,
                'staff_login',
                "Staff '{$staff->name}' ({$staff->staff_code}) logged in successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $staff->id,
                    'staff_code' => $staff->staff_code,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'mobile' => $staff->mobile,
                    'department' => $staff->department,
                    'designation' => $staff->designation,
                    'employment_type' => $staff->employment_type,
                    'image' => $staff->profile_photo,
                    'image_url' => $staff->image_url,
                    'status' => $staff->status,
                    'is_active' => $staff->is_active,
                    'last_login_at' => $staff->last_login_at,
                    'created_at' => $staff->created_at,
                    'role' => 'staff',
                    'user_type' => 'staff',
                ],
            ]);
        }

        return response()->json([
            'message' => 'The provided credentials do not match our records.',
            'errors' => [
                'email' => ['The provided credentials do not match our records.'],
            ],
        ], 422);
    }

    /**
     * Get the authenticated Admin or Staff.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof Staff) {
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'staff_code' => $user->staff_code,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'department' => $user->department,
                    'designation' => $user->designation,
                    'employment_type' => $user->employment_type,
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

        return response()->json([
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
     * Log out current Admin or Staff session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        $actorType = ($user instanceof Staff) ? 'staff' : 'admin';
        $title = ($user instanceof Staff) ? "Staff '{$user->name}' logged out." : "Admin '{$user->name}' logged out.";

        AdminActivityLog::record(
            $actorType,
            $user->id,
            $actorType.'_logout',
            $title,
            $request
        );

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Forgot password request for Admin or Staff.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $admin = Admin::where('email', $validated['email'])->first();
        $targetUser = $admin;
        $actorType = 'admin';

        if (! $targetUser) {
            $staff = Staff::where('email', $validated['email'])->first();
            if ($staff) {
                $targetUser = $staff;
                $actorType = 'staff';
            }
        }

        if ($targetUser && $targetUser->is_active) {
            $plainToken = Str::random(60);
            $hashedToken = Hash::make($plainToken);

            DB::table('admin_password_reset_tokens')->updateOrInsert(
                ['email' => $targetUser->email],
                [
                    'token' => $hashedToken,
                    'created_at' => Carbon::now(),
                ]
            );

            $resetUrl = url("/admin/reset-password?token={$plainToken}&email=".urlencode($targetUser->email));
            Log::info("Password Reset Token for {$targetUser->email}: {$plainToken} | URL: {$resetUrl}");

            AdminActivityLog::record(
                $actorType,
                $targetUser->id,
                'password_reset_requested',
                "Password reset requested for {$actorType} email: {$targetUser->email}",
                $request
            );
        }

        return response()->json([
            'message' => 'If your email address is registered, you will receive password reset instructions shortly.',
            'dev_reset_token' => app()->isLocal() && isset($plainToken) ? $plainToken : null,
        ]);
    }

    /**
     * Reset password using token for Admin or Staff.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        $record = DB::table('admin_password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
                'errors' => [
                    'token' => ['Invalid or expired password reset token.'],
                ],
            ], 422);
        }

        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('admin_password_reset_tokens')->where('email', $validated['email'])->delete();

            return response()->json([
                'message' => 'This password reset token has expired. Please request a new one.',
                'errors' => [
                    'token' => ['This password reset token has expired.'],
                ],
            ], 422);
        }

        if (! Hash::check($validated['token'], $record->token)) {
            return response()->json([
                'message' => 'Invalid password reset token.',
                'errors' => [
                    'token' => ['Invalid password reset token.'],
                ],
            ], 422);
        }

        $admin = Admin::where('email', $validated['email'])->first();

        if ($admin) {
            $admin->update([
                'password' => Hash::make($validated['password']),
            ]);

            DB::table('admin_password_reset_tokens')->where('email', $validated['email'])->delete();
            $admin->tokens()->delete();

            AdminActivityLog::record(
                'admin',
                $admin->id,
                'password_reset_completed',
                "Admin '{$admin->name}' successfully reset their password.",
                $request
            );

            return response()->json([
                'message' => 'Password reset successfully. You may now log in with your new password.',
            ]);
        }

        $staff = Staff::where('email', $validated['email'])->first();

        if ($staff) {
            $staff->update([
                'password' => Hash::make($validated['password']),
            ]);

            DB::table('admin_password_reset_tokens')->where('email', $validated['email'])->delete();
            $staff->tokens()->delete();

            AdminActivityLog::record(
                'staff',
                $staff->id,
                'password_reset_completed',
                "Staff '{$staff->name}' ({$staff->staff_code}) successfully reset their password.",
                $request
            );

            return response()->json([
                'message' => 'Password reset successfully. You may now log in with your new password.',
            ]);
        }

        return response()->json([
            'message' => 'Account not found.',
        ], 404);
    }
}
