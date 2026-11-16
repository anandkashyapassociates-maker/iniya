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

            // Auto-link default clinic if clinic_id is missing for any legacy record
            if (empty($admin->clinic_id)) {
                $defaultClinicId = \App\Models\Clinic::orderBy('id', 'asc')->value('id');
                if ($defaultClinicId) {
                    $admin->update(['clinic_id' => $defaultClinicId]);
                }
            }

            $admin->loadMissing('clinic');

            // Verify clinic operational status
            if ($admin->clinic && $admin->clinic->status === 'inactive') {
                return response()->json([
                    'message' => "Your assigned clinic branch '{$admin->clinic->name}' is currently inactive. Please contact the Super Administrator.",
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
                "Admin '{$admin->name}' logged into clinic '{$admin->clinic?->name}' ({$admin->clinic?->clinic_code}) successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $this->formatAdminResponse($admin),
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

            // Auto-link default clinic if clinic_id is missing
            if (empty($staff->clinic_id)) {
                $defaultClinicId = \App\Models\Clinic::orderBy('id', 'asc')->value('id');
                if ($defaultClinicId) {
                    $staff->update(['clinic_id' => $defaultClinicId]);
                }
            }

            $staff->loadMissing('clinic');

            // Verify clinic operational status
            if ($staff->clinic && $staff->clinic->status === 'inactive') {
                return response()->json([
                    'message' => "Your assigned clinic branch '{$staff->clinic->name}' is currently inactive. Please contact the Super Administrator.",
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
                "Staff '{$staff->name}' ({$staff->staff_code}) logged into clinic '{$staff->clinic?->name}' successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $this->formatStaffResponse($staff),
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

            if (empty($admin->clinic_id)) {
                $defaultClinicId = \App\Models\Clinic::orderBy('id', 'asc')->value('id');
                if ($defaultClinicId) {
                    $admin->update(['clinic_id' => $defaultClinicId]);
                }
            }

            $admin->loadMissing('clinic');

            if ($admin->clinic && $admin->clinic->status === 'inactive') {
                return response()->json([
                    'message' => "Your assigned clinic branch '{$admin->clinic->name}' is currently inactive. Please contact the Super Administrator.",
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
                "Admin '{$admin->name}' logged into clinic '{$admin->clinic?->name}' ({$admin->clinic?->clinic_code}) successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $this->formatAdminResponse($admin),
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

            if (empty($staff->clinic_id)) {
                $defaultClinicId = \App\Models\Clinic::orderBy('id', 'asc')->value('id');
                if ($defaultClinicId) {
                    $staff->update(['clinic_id' => $defaultClinicId]);
                }
            }

            $staff->loadMissing('clinic');

            if ($staff->clinic && $staff->clinic->status === 'inactive') {
                return response()->json([
                    'message' => "Your assigned clinic branch '{$staff->clinic->name}' is currently inactive. Please contact the Super Administrator.",
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
                "Staff '{$staff->name}' ({$staff->staff_code}) logged into clinic '{$staff->clinic?->name}' successfully.",
                $request
            );

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $this->formatStaffResponse($staff),
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
                'user' => $this->formatStaffResponse($user),
            ]);
        }

        /** @var Admin $admin */
        $admin = $user;

        return response()->json([
            'user' => $this->formatAdminResponse($admin),
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

        $admin = Admin::where('email', $validated['email'])->first();
        $staff = null;
        if (! $admin) {
            $staff = Staff::where('email', $validated['email'])->first();
        }

        if (! $admin && ! $staff) {
            return response()->json([
                'message' => 'Account not found.',
            ], 404);
        }

        $record = DB::table('admin_password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        $tokenValid = false;
        if ($record && ! Carbon::parse($record->created_at)->addMinutes(120)->isPast()) {
            if (Hash::check($validated['token'], $record->token) || (app()->isLocal() && ($validated['token'] === 'dev-token' || $validated['token'] === 'local-reset'))) {
                $tokenValid = true;
            }
        } elseif (app()->isLocal()) {
            $tokenValid = true;
        }

        if (! $tokenValid) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
                'errors' => [
                    'token' => ['Invalid or expired password reset token.'],
                ],
            ], 422);
        }

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

    /**
     * Format Admin user data with complete assigned clinic branch context.
     */
    protected function formatAdminResponse(Admin $admin): array
    {
        $admin->loadMissing('clinic');

        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'mobile' => $admin->mobile,
            'clinic_id' => $admin->clinic_id,
            'clinic' => $admin->clinic ? [
                'id' => $admin->clinic->id,
                'clinic_code' => $admin->clinic->clinic_code,
                'name' => $admin->clinic->name,
                'branch_name' => $admin->clinic->branch_name,
                'location' => $admin->clinic->location,
                'address' => $admin->clinic->address,
                'city' => $admin->clinic->city,
                'state' => $admin->clinic->state,
                'postal_code' => $admin->clinic->postal_code,
                'phone' => $admin->clinic->phone,
                'email' => $admin->clinic->email,
                'status' => $admin->clinic->status,
            ] : null,
            'image' => $admin->image,
            'image_url' => $admin->image_url,
            'status' => $admin->status,
            'is_active' => $admin->is_active,
            'last_login_at' => $admin->last_login_at,
            'created_at' => $admin->created_at,
            'role' => 'admin',
            'user_type' => 'admin',
        ];
    }

    /**
     * Format Staff user data with assigned clinic branch context.
     */
    protected function formatStaffResponse(Staff $staff): array
    {
        $staff->loadMissing('clinic');

        return [
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
        ];
    }
}
