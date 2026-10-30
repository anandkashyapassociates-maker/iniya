<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuperAdminAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful Super Admin login with valid credentials.
     */
    public function test_superadmin_can_login_with_valid_credentials(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Chief Executive',
            'email' => 'chief@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/superadmin/login', [
            'email' => 'chief@superadmin.com',
            'password' => 'Password@2026!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'is_active',
                    'role',
                ],
            ]);

        $this->assertNotEmpty($response->json('token'));
        $this->assertEquals('chief@superadmin.com', $response->json('user.email'));
        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    /**
     * Test login failure with incorrect password.
     */
    public function test_login_fails_with_incorrect_password(): void
    {
        SuperAdmin::create([
            'name' => 'Security Admin',
            'email' => 'security@superadmin.com',
            'password' => Hash::make('CorrectPassword123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/superadmin/login', [
            'email' => 'security@superadmin.com',
            'password' => 'WrongPassword123!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login failure with unknown email address.
     */
    public function test_login_fails_with_unknown_email(): void
    {
        $response = $this->postJson('/api/superadmin/login', [
            'email' => 'nonexistent@superadmin.com',
            'password' => 'AnyPassword123!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test that inactive/deactivated Super Admin accounts are rejected.
     */
    public function test_inactive_superadmin_cannot_login(): void
    {
        SuperAdmin::create([
            'name' => 'Suspended Admin',
            'email' => 'suspended@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/superadmin/login', [
            'email' => 'suspended@superadmin.com',
            'password' => 'Password@2026!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your Super Admin account has been deactivated.',
            ]);
    }

    /**
     * Test validation failures on empty or malformed inputs.
     */
    public function test_login_validation_fails_on_missing_fields(): void
    {
        $response = $this->postJson('/api/superadmin/login', [
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test protected Super Admin endpoints deny unauthenticated access.
     */
    public function test_protected_endpoint_rejects_unauthenticated_request(): void
    {
        $response = $this->getJson('/api/superadmin/me');

        $response->assertStatus(401);
    }

    /**
     * Test protected endpoint allows authenticated Super Admin.
     */
    public function test_authenticated_superadmin_can_access_me_endpoint(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Root Executive',
            'email' => 'root@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        $token = $superAdmin->createToken('test-token', ['role:superadmin'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/superadmin/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $superAdmin->id,
                    'name' => 'Root Executive',
                    'email' => 'root@superadmin.com',
                    'is_active' => true,
                    'role' => 'super_admin',
                ],
            ]);

        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    /**
     * Test ordinary ERP user or standard admin CANNOT access Super Admin endpoints.
     */
    public function test_ordinary_user_or_admin_cannot_access_superadmin_endpoint(): void
    {
        // 1. Standard Admin model
        $admin = Admin::create([
            'name' => 'General Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('Admin@2026!'),
            'is_active' => true,
        ]);

        $adminToken = $admin->createToken('admin-token', ['role:admin'])->plainTextToken;

        // Attempting to access Super Admin endpoint with Admin token
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/superadmin/me');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Access denied. Super Admin privileges required.',
            ]);

        // 2. Standard User model
        $user = User::create([
            'name' => 'ERP Member',
            'email' => 'member@example.com',
            'password' => Hash::make('Member@2026!'),
        ]);

        $userToken = $user->createToken('user-token')->plainTextToken;

        $userResponse = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/superadmin/me');

        $userResponse->assertStatus(403)
            ->assertJson([
                'message' => 'Access denied. Super Admin privileges required.',
            ]);
    }

    /**
     * Test successful logout revokes access token.
     */
    public function test_superadmin_logout_revokes_current_token(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Logout Admin',
            'email' => 'logout@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        $token = $superAdmin->createToken('test-token', ['role:superadmin'])->plainTextToken;

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/superadmin/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);

        // Verify token record was deleted from personal_access_tokens
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Reset auth guards in test container between requests
        $this->app['auth']->forgetGuards();

        // Accessing protected endpoint with revoked token must fail
        $subsequentResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/superadmin/me');

        $subsequentResponse->assertStatus(401);
    }

    /**
     * Test forgot password endpoint does not reveal email existence.
     */
    public function test_forgot_password_does_not_reveal_email_existence(): void
    {
        SuperAdmin::create([
            'name' => 'Existing Admin',
            'email' => 'existing@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        // Existing email
        $res1 = $this->postJson('/api/superadmin/forgot-password', [
            'email' => 'existing@superadmin.com',
        ]);

        $res1->assertStatus(200)
            ->assertJson([
                'message' => 'If your email address is registered, you will receive password reset instructions shortly.',
            ]);

        // Non-existing email
        $res2 = $this->postJson('/api/superadmin/forgot-password', [
            'email' => 'unknown@superadmin.com',
        ]);

        $res2->assertStatus(200)
            ->assertJson([
                'message' => 'If your email address is registered, you will receive password reset instructions shortly.',
            ]);
    }

    /**
     * Test successful password reset with valid token.
     */
    public function test_superadmin_can_reset_password_with_valid_token(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Reset Admin',
            'email' => 'reset@superadmin.com',
            'password' => Hash::make('OldPassword@2026!'),
            'is_active' => true,
        ]);

        $plainToken = 'test-reset-token-secret-12345';
        DB::table('super_admin_password_reset_tokens')->insert([
            'email' => $superAdmin->email,
            'token' => Hash::make($plainToken),
            'created_at' => Carbon::now(),
        ]);

        $response = $this->postJson('/api/superadmin/reset-password', [
            'email' => $superAdmin->email,
            'token' => $plainToken,
            'password' => 'NewSecurePassword@2026!',
            'password_confirmation' => 'NewSecurePassword@2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password reset successfully. You may now log in with your new password.',
            ]);

        // Verify password was updated and hashed
        $superAdmin->refresh();
        $this->assertTrue(Hash::check('NewSecurePassword@2026!', $superAdmin->password));

        // Verify reset token was deleted (single-use)
        $this->assertDatabaseMissing('super_admin_password_reset_tokens', [
            'email' => $superAdmin->email,
        ]);
    }

    /**
     * Test password reset rejects expired or invalid tokens.
     */
    public function test_reset_password_rejects_expired_or_invalid_tokens(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Expire Admin',
            'email' => 'expire@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        // 1. Expired token (created 70 minutes ago)
        $expiredToken = 'expired-token-123';
        DB::table('super_admin_password_reset_tokens')->insert([
            'email' => $superAdmin->email,
            'token' => Hash::make($expiredToken),
            'created_at' => Carbon::now()->subMinutes(70),
        ]);

        $responseExpired = $this->postJson('/api/superadmin/reset-password', [
            'email' => $superAdmin->email,
            'token' => $expiredToken,
            'password' => 'NewPassword@2026!',
            'password_confirmation' => 'NewPassword@2026!',
        ]);

        $responseExpired->assertStatus(422)
            ->assertJsonValidationErrors(['token']);

        // 2. Mismatched token
        DB::table('super_admin_password_reset_tokens')->insert([
            'email' => $superAdmin->email,
            'token' => Hash::make('real-token-secret'),
            'created_at' => Carbon::now(),
        ]);

        $responseWrongToken = $this->postJson('/api/superadmin/reset-password', [
            'email' => $superAdmin->email,
            'token' => 'tampered-wrong-token',
            'password' => 'NewPassword@2026!',
            'password_confirmation' => 'NewPassword@2026!',
        ]);

        $responseWrongToken->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    /**
     * Test password reset token cannot be reused.
     */
    public function test_reset_token_cannot_be_reused(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Reuse Admin',
            'email' => 'reuse@superadmin.com',
            'password' => Hash::make('Password@2026!'),
            'is_active' => true,
        ]);

        $plainToken = 'single-use-token-abc';
        DB::table('super_admin_password_reset_tokens')->insert([
            'email' => $superAdmin->email,
            'token' => Hash::make($plainToken),
            'created_at' => Carbon::now(),
        ]);

        // First use: Success
        $firstUse = $this->postJson('/api/superadmin/reset-password', [
            'email' => $superAdmin->email,
            'token' => $plainToken,
            'password' => 'FirstReset@2026!',
            'password_confirmation' => 'FirstReset@2026!',
        ]);
        $firstUse->assertStatus(200);

        // Second use: Must be rejected
        $secondUse = $this->postJson('/api/superadmin/reset-password', [
            'email' => $superAdmin->email,
            'token' => $plainToken,
            'password' => 'SecondReset@2026!',
            'password_confirmation' => 'SecondReset@2026!',
        ]);
        $secondUse->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    /**
     * Test passwords are never stored in plaintext.
     */
    public function test_superadmin_passwords_are_stored_hashed(): void
    {
        $plaintext = 'StrictSecret@2026!';
        $superAdmin = SuperAdmin::create([
            'name' => 'Hash Test',
            'email' => 'hashtest@superadmin.com',
            'password' => Hash::make($plaintext),
            'is_active' => true,
        ]);

        $rawRecord = DB::table('super_admins')->where('id', $superAdmin->id)->first();

        $this->assertNotEquals($plaintext, $rawRecord->password);
        $this->assertTrue(str_starts_with($rawRecord->password, '$2y$') || str_starts_with($rawRecord->password, '$argon2id$') || str_starts_with($rawRecord->password, '$2b$'));
        $this->assertTrue(Hash::check($plaintext, $rawRecord->password));
    }

    /**
     * Test that general user authentication remains functional without regression.
     */
    public function test_existing_general_user_route_remains_functional(): void
    {
        $user = User::create([
            'name' => 'Standard Client',
            'email' => 'client@erp.com',
            'password' => Hash::make('Client@2026!'),
        ]);

        $token = $user->createToken('client-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'email' => 'client@erp.com',
            ]);
    }
}
