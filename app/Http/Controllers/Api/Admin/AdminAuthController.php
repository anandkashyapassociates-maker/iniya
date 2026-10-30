<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
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
     * Authenticate Admin and issue Sanctum token.
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
        $verification = $this->turnstileService->verify($captchaToken, $request->ip(), 'admin_login');

        if (! $verification['success']) {
            return response()->json([
                'message' => $verification['message'],
                'errors' => [
                    'captcha' => [$verification['message']],
                ],
            ], 422);
        }

        $admin = Admin::where('email', $validated['email'])->first();

        if (! $admin || ! Hash::check($validated['password'], $admin->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
                'errors' => [
                    'email' => ['The provided credentials do not match our records.'],
                ],
            ], 422);
        }

        if (! $admin->is_active) {
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
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
                'role' => 'admin',
            ],
        ]);
    }

    /**
     * Get the authenticated Admin.
     */
    public function me(Request $request): JsonResponse
    {
        $admin = $request->user();

        return response()->json([
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
     * Log out current Admin session.
     */
    public function logout(Request $request): JsonResponse
    {
        $admin = $request->user();

        if ($admin && $admin->currentAccessToken()) {
            $admin->currentAccessToken()->delete();
        }

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'admin_logout',
            "Admin '{$admin->name}' logged out.",
            $request
        );

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Forgot password request for Admin.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $admin = Admin::where('email', $validated['email'])->first();

        if ($admin && $admin->is_active) {
            $plainToken = Str::random(60);
            $hashedToken = Hash::make($plainToken);

            DB::table('admin_password_reset_tokens')->updateOrInsert(
                ['email' => $admin->email],
                [
                    'token' => $hashedToken,
                    'created_at' => Carbon::now(),
                ]
            );

            $resetUrl = url("/admin/reset-password?token={$plainToken}&email=" . urlencode($admin->email));
            Log::info("Admin Password Reset Token for {$admin->email}: {$plainToken} | URL: {$resetUrl}");

            AdminActivityLog::record(
                'admin',
                $admin->id,
                'password_reset_requested',
                "Password reset requested for Admin email: {$admin->email}",
                $request
            );
        }

        return response()->json([
            'message' => 'If your email address is registered, you will receive password reset instructions shortly.',
            'dev_reset_token' => app()->isLocal() && isset($plainToken) ? $plainToken : null,
        ]);
    }

    /**
     * Reset password using token for Admin.
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

        if (! $admin) {
            return response()->json([
                'message' => 'Account not found.',
            ], 404);
        }

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
}

