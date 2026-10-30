<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\SuperAdmin;
use App\Services\TurnstileService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class SuperAdminAuthController extends Controller
{
    public function __construct(
        protected TurnstileService $turnstileService
    ) {}

    /**
     * Authenticate Super Admin and generate Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'turnstile_token' => ['nullable', 'string'],
            'cf_turnstile_response' => ['nullable', 'string'],
        ]);

        $captchaToken = $validated['turnstile_token'] ?? $validated['cf_turnstile_response'] ?? null;
        $verification = $this->turnstileService->verify($captchaToken, $request->ip(), 'superadmin_login');

        if (! $verification['success']) {
            return response()->json([
                'message' => $verification['message'],
                'errors' => [
                    'captcha' => [$verification['message']],
                ],
            ], 422);
        }

        $superAdmin = SuperAdmin::where('email', $validated['email'])->first();

        if (! $superAdmin || ! Hash::check($validated['password'], $superAdmin->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
                'errors' => [
                    'email' => ['The provided credentials do not match our records.'],
                ],
            ], 422);
        }

        if (! $superAdmin->is_active) {
            return response()->json([
                'message' => 'Your Super Admin account has been deactivated.',
            ], 403);
        }

        $superAdmin->update([
            'last_login_at' => Carbon::now(),
        ]);

        $token = $superAdmin->createToken('superadmin-token', ['role:superadmin'])->plainTextToken;

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'superadmin_login',
            "Super Admin '{$superAdmin->name}' logged in successfully.",
            $request
        );

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
                'is_active' => $superAdmin->is_active,
                'last_login_at' => $superAdmin->last_login_at,
                'created_at' => $superAdmin->created_at,
                'role' => 'super_admin',
            ],
        ]);
    }

    /**
     * Get the authenticated Super Admin.
     */
    public function me(Request $request): JsonResponse
    {
        $superAdmin = $request->user();

        return response()->json([
            'user' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
                'is_active' => $superAdmin->is_active,
                'last_login_at' => $superAdmin->last_login_at,
                'created_at' => $superAdmin->created_at,
                'role' => 'super_admin',
            ],
        ]);
    }

    /**
     * Log out current session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        AdminActivityLog::record(
            'super_admin',
            $user->id,
            'superadmin_logout',
            "Super Admin '{$user->name}' logged out.",
            $request
        );

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Request password reset link / token.
     * Note: Does not reveal if the email exists.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $superAdmin = SuperAdmin::where('email', $validated['email'])->first();

        if ($superAdmin && $superAdmin->is_active) {
            $plainToken = Str::random(60);
            $hashedToken = Hash::make($plainToken);

            DB::table('super_admin_password_reset_tokens')->updateOrInsert(
                ['email' => $superAdmin->email],
                [
                    'token' => $hashedToken,
                    'created_at' => Carbon::now(),
                ]
            );

            // In local/development, we log the reset link for easy testing
            $resetUrl = url("/superadmin/reset-password?token={$plainToken}&email=" . urlencode($superAdmin->email));
            Log::info("Super Admin Password Reset Token for {$superAdmin->email}: {$plainToken} | URL: {$resetUrl}");

            AdminActivityLog::record(
                'super_admin',
                $superAdmin->id,
                'password_reset_requested',
                "Password reset requested for Super Admin email: {$superAdmin->email}",
                $request
            );
        }

        return response()->json([
            'message' => 'If your email address is registered, you will receive password reset instructions shortly.',
            // Include token in local development payload to facilitate testing without mail server
            'dev_reset_token' => app()->isLocal() && isset($plainToken) ? $plainToken : null,
        ]);
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        $record = DB::table('super_admin_password_reset_tokens')
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

        // Token expires after 60 minutes
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('super_admin_password_reset_tokens')->where('email', $validated['email'])->delete();
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

        $superAdmin = SuperAdmin::where('email', $validated['email'])->first();

        if (! $superAdmin) {
            return response()->json([
                'message' => 'Account not found.',
            ], 404);
        }

        $superAdmin->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Invalidate reset token
        DB::table('super_admin_password_reset_tokens')->where('email', $validated['email'])->delete();

        // Revoke all existing tokens for security
        $superAdmin->tokens()->delete();

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'password_reset_completed',
            "Super Admin '{$superAdmin->name}' successfully reset their password.",
            $request
        );

        return response()->json([
            'message' => 'Password reset successfully. You may now log in with your new password.',
        ]);
    }

    /**
     * Update Super Admin profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $superAdmin = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:super_admins,email,' . $superAdmin->id],
        ]);

        $superAdmin->update($validated);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'profile_updated',
            "Super Admin updated profile details.",
            $request
        );

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
                'is_active' => $superAdmin->is_active,
                'last_login_at' => $superAdmin->last_login_at,
                'created_at' => $superAdmin->created_at,
                'role' => 'super_admin',
            ],
        ]);
    }

    /**
     * Change Super Admin password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $superAdmin = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($validated['current_password'], $superAdmin->password)) {
            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The provided current password does not match our records.'],
                ],
            ], 422);
        }

        $superAdmin->update([
            'password' => Hash::make($validated['password']),
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'password_changed',
            "Super Admin changed their password.",
            $request
        );

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}

