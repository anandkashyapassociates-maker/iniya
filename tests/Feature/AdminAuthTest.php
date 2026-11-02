<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Staff;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;

    protected Admin $admin;

    protected Staff $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Main SuperAdmin',
            'email' => 'superadmin@example.com',
            'password' => Hash::make('SuperPass123!'),
            'is_active' => true,
        ]);

        $this->admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Clinic Admin',
            'email' => 'admin@example.com',
            'mobile' => '9876543210',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->staff = Staff::create([
            'created_by_superadmin_id' => $this->superAdmin->id,
            'staff_code' => 'STF-001',
            'name' => 'Dr. Ramesh Kumar',
            'email' => 'ramesh@iniya.com',
            'password' => Hash::make('StaffPass123!'),
            'department' => 'Dental Care',
            'designation' => 'Senior Dentist',
            'employment_type' => 'Full-Time',
            'status' => 'active',
            'is_active' => true,
        ]);
    }

    /**
     * Admin can log in successfully via admin login endpoint.
     */
    public function test_admin_can_login_successfully(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'AdminPass123!',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'user_type',
                ],
            ]);

        $this->assertSame('admin', $response->json('user.role'));
        $this->assertSame('admin', $response->json('user.user_type'));
    }

    /**
     * Staff member can log in successfully via the same admin login endpoint.
     */
    public function test_staff_can_login_successfully_via_admin_login_endpoint(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'StaffPass123!',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'staff_code',
                    'name',
                    'email',
                    'department',
                    'role',
                    'user_type',
                ],
            ]);

        $this->assertSame('staff', $response->json('user.role'));
        $this->assertSame('staff', $response->json('user.user_type'));
        $this->assertSame('STF-001', $response->json('user.staff_code'));
        $this->assertSame('Dr. Ramesh Kumar', $response->json('user.name'));
    }

    /**
     * Staff member with invalid password cannot log in.
     */
    public function test_staff_with_invalid_password_cannot_login(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'WrongPassword!',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Blocked staff cannot log in and receives 403.
     */
    public function test_blocked_staff_cannot_login(): void
    {
        $this->staff->update([
            'status' => 'blocked',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'StaffPass123!',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your Staff account has been blocked by the Super Administrator. Access denied.',
            ]);
    }

    /**
     * Inactive staff cannot log in and receives 403.
     */
    public function test_inactive_staff_cannot_login(): void
    {
        $this->staff->update([
            'status' => 'inactive',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'StaffPass123!',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your Staff account is deactivated. Please contact your Super Administrator.',
            ]);
    }

    /**
     * Authenticated staff member can fetch /api/admin/me profile.
     */
    public function test_authenticated_staff_can_access_me_endpoint(): void
    {
        $token = $this->staff->createToken('staff-token', ['role:staff'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $this->staff->id,
                    'staff_code' => 'STF-001',
                    'name' => 'Dr. Ramesh Kumar',
                    'email' => 'ramesh@iniya.com',
                    'role' => 'staff',
                ],
            ]);
    }

    /**
     * Authenticated staff member passes EnsureAdmin middleware and accesses dashboard.
     */
    public function test_authenticated_staff_can_access_admin_dashboard(): void
    {
        $token = $this->staff->createToken('staff-token', ['role:staff'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
    }

    /**
     * Authenticated staff can log out.
     */
    public function test_authenticated_staff_can_logout(): void
    {
        $token = $this->staff->createToken('staff-token', ['role:staff'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);
    }

    /**
     * When account_type is 'admin', admin login succeeds.
     */
    public function test_login_with_admin_selection_authenticates_admin(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'AdminPass123!',
            'account_type' => 'admin',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(200);
        $this->assertSame('admin', $response->json('user.role'));
    }

    /**
     * When account_type is 'admin', staff credentials are not permitted.
     */
    public function test_login_with_admin_selection_rejects_staff_credentials(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'StaffPass123!',
            'account_type' => 'admin',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'The provided Admin credentials do not match our records.',
            ]);
    }

    /**
     * When account_type is 'staff', staff login succeeds.
     */
    public function test_login_with_staff_selection_authenticates_staff(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'ramesh@iniya.com',
            'password' => 'StaffPass123!',
            'account_type' => 'staff',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(200);
        $this->assertSame('staff', $response->json('user.role'));
        $this->assertSame('STF-001', $response->json('user.staff_code'));
    }

    /**
     * When account_type is 'staff', admin credentials are not permitted.
     */
    public function test_login_with_staff_selection_rejects_admin_credentials(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'AdminPass123!',
            'account_type' => 'staff',
            'turnstile_token' => 'test-token',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'The provided Staff credentials do not match our records.',
            ]);
    }
}
