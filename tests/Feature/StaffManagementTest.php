<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Staff;
use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;
    protected string $superAdminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Lead Superadmin',
            'email' => 'superadmin_staff_test_' . uniqid() . '@example.com',
            'password' => Hash::make('SuperSecurePass@2026!'),
            'is_active' => true,
        ]);

        $this->superAdminToken = $this->superAdmin->createToken('superadmin-test-token', ['role:superadmin'])->plainTextToken;
    }

    /**
     * 1. Authorized Superadmin can create Staff.
     */
    public function test_authorized_superadmin_can_create_staff(): void
    {
        $payload = [
            'name' => 'Alice Staff',
            'email' => 'alice_' . uniqid() . '@company.com',
            'mobile' => '9888812345',
            'department' => 'Engineering',
            'designation' => 'Senior Developer',
            'employment_type' => 'Full-Time',
            'joining_date' => '2026-01-15',
            'address' => '123 Tech Park, Suite 400',
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'staff' => [
                    'id',
                    'staff_code',
                    'name',
                    'email',
                    'mobile',
                    'department',
                    'designation',
                    'employment_type',
                    'joining_date',
                    'status',
                    'is_active',
                    'created_by_superadmin_id',
                ],
            ]);

        $staffCode = $response->json('staff.staff_code');
        $this->assertStringStartsWith('STF-', $staffCode);

        $this->assertDatabaseHas('staff', [
            'email' => $payload['email'],
            'staff_code' => $staffCode,
            'department' => 'Engineering',
            'status' => 'active',
            'is_active' => true,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);
    }

    /**
     * 2. Unauthenticated requests cannot create Staff.
     */
    public function test_unauthenticated_requests_cannot_create_staff(): void
    {
        $response = $this->postJson('/api/superadmin/staff', [
            'name' => 'Unauth Staff',
            'email' => 'unauth@company.com',
        ]);

        $response->assertStatus(401);
    }

    /**
     * 3. Unauthorized Admins cannot create Staff through Superadmin endpoints.
     */
    public function test_unauthorized_admins_cannot_create_staff_through_superadmin_endpoint(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Panel 2 Admin',
            'email' => 'panel2admin_' . uniqid() . '@company.com',
            'mobile' => '9777712345',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $adminToken = $admin->createToken('admin-token', ['role:admin'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => 'Unauthorized Staff Attempt',
                'email' => 'no_access@company.com',
            ]);

        $response->assertStatus(403);
    }

    /**
     * 4. Invalid input is rejected.
     */
    public function test_invalid_input_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => '',
                'email' => 'not-an-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    /**
     * 5. Duplicate email addresses are rejected.
     */
    public function test_duplicate_email_addresses_are_rejected(): void
    {
        $email = 'duplicate_staff_' . uniqid() . '@company.com';

        Staff::create([
            'staff_code' => 'STF-0099',
            'name' => 'Existing Staff Member',
            'email' => $email,
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => 'New Staff Same Email',
                'email' => $email,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 6. Staff codes are unique and generated on backend.
     */
    public function test_staff_codes_are_unique_and_generated_on_backend(): void
    {
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => 'Staff Alpha',
                'email' => 'alpha_' . uniqid() . '@company.com',
            ]);

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => 'Staff Beta',
                'email' => 'beta_' . uniqid() . '@company.com',
            ]);

        $res1->assertStatus(201);
        $res2->assertStatus(201);

        $code1 = $res1->json('staff.staff_code');
        $code2 = $res2->json('staff.staff_code');

        $this->assertNotEmpty($code1);
        $this->assertNotEmpty($code2);
        $this->assertNotEquals($code1, $code2);
    }

    /**
     * 7-10. Staff records are stored in the dedicated staff table and not merged.
     */
    public function test_staff_records_are_stored_in_dedicated_staff_table_and_not_merged(): void
    {
        $email = 'isolated_staff_' . uniqid() . '@company.com';

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/staff', [
                'name' => 'Isolated Staff',
                'email' => $email,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('staff', ['email' => $email]);
        $this->assertDatabaseMissing('users', ['email' => $email]);
        $this->assertDatabaseMissing('admins', ['email' => $email]);
        $this->assertDatabaseMissing('super_admins', ['email' => $email]);
    }

    /**
     * 11. Staff listing returns correct records.
     */
    public function test_staff_listing_returns_records(): void
    {
        $email = 'list_staff_' . uniqid() . '@company.com';
        Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Listing Test Staff',
            'email' => $email,
            'department' => 'Operations',
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data',
                'total',
            ]);

        $emails = collect($response->json('data'))->pluck('email')->toArray();
        $this->assertContains($email, $emails);
    }

    /**
     * 12. Search works by code, name, email, and mobile.
     */
    public function test_search_works_by_code_name_email_and_mobile(): void
    {
        $uniqueTag = uniqid();
        $staff = Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'UniqueStaffName ' . $uniqueTag,
            'email' => 'searchable_' . $uniqueTag . '@company.com',
            'mobile' => '9111222333',
            'department' => 'Finance',
            'status' => 'active',
            'is_active' => true,
        ]);

        // Search by unique name
        $resName = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?search=' . $uniqueTag);
        $this->assertCount(1, $resName->json('data'));
        $this->assertEquals($staff->id, $resName->json('data.0.id'));

        // Search by staff code
        $resCode = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?search=' . $staff->staff_code);
        $this->assertCount(1, $resCode->json('data'));

        // Search by mobile
        $resMobile = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?search=9111222333');
        $this->assertGreaterThanOrEqual(1, count($resMobile->json('data')));
    }

    /**
     * 13. Department filtering works.
     */
    public function test_department_filtering_works(): void
    {
        $dept = 'SpecialDept_' . uniqid();

        Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Dept Staff One',
            'email' => 'dept1_' . uniqid() . '@company.com',
            'department' => $dept,
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?department=' . $dept);

        $response->assertStatus(200);
        $departments = collect($response->json('data'))->pluck('department')->unique()->toArray();
        $this->assertEquals([$dept], $departments);
    }

    /**
     * 14. Status filtering works.
     */
    public function test_status_filtering_works(): void
    {
        $activeEmail = 'filter_active_' . uniqid() . '@company.com';
        $blockedEmail = 'filter_blocked_' . uniqid() . '@company.com';

        Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Active Staff',
            'email' => $activeEmail,
            'status' => 'active',
            'is_active' => true,
        ]);

        Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Blocked Staff',
            'email' => $blockedEmail,
            'status' => 'blocked',
            'is_active' => false,
        ]);

        // Filter active
        $resActive = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?status=active');
        $resActive->assertStatus(200);
        $activeEmails = collect($resActive->json('data'))->pluck('email')->toArray();
        $this->assertContains($activeEmail, $activeEmails);
        $this->assertNotContains($blockedEmail, $activeEmails);

        // Filter blocked
        $resBlocked = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?status=blocked');
        $resBlocked->assertStatus(200);
        $blockedEmails = collect($resBlocked->json('data'))->pluck('email')->toArray();
        $this->assertContains($blockedEmail, $blockedEmails);
        $this->assertNotContains($activeEmail, $blockedEmails);
    }

    /**
     * 15. Superadmin can edit staff details via PUT endpoint.
     */
    public function test_superadmin_can_edit_staff_details(): void
    {
        $staff = Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Before Edit Name',
            'email' => 'before_edit_' . uniqid() . '@company.com',
            'department' => 'HR',
            'status' => 'active',
            'is_active' => true,
        ]);

        $updatedEmail = 'after_edit_' . uniqid() . '@company.com';

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson("/api/superadmin/staff/{$staff->id}", [
                'name' => 'After Edit Name',
                'email' => $updatedEmail,
                'department' => 'Executive HR',
                'designation' => 'HR Director',
                'status' => 'blocked',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Staff member updated successfully.',
                'staff' => [
                    'id' => $staff->id,
                    'name' => 'After Edit Name',
                    'email' => $updatedEmail,
                    'department' => 'Executive HR',
                    'designation' => 'HR Director',
                    'status' => 'blocked',
                    'is_active' => false,
                ],
            ]);

        $this->assertDatabaseHas('staff', [
            'id' => $staff->id,
            'name' => 'After Edit Name',
            'email' => $updatedEmail,
            'department' => 'Executive HR',
            'status' => 'blocked',
            'is_active' => false,
        ]);
    }

    /**
     * 16. Missing Staff IDs return 404 response.
     */
    public function test_missing_staff_id_returns_404(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff/999999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Staff member not found.',
            ]);
    }

    /**
     * 17. Preview code returns valid code format.
     */
    public function test_preview_code_returns_valid_format(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff/preview-code');

        $response->assertStatus(200)
            ->assertJsonStructure(['preview_code']);

        $this->assertStringStartsWith('STF-', $response->json('preview_code'));
    }

    /**
     * 18. Superadmin can update staff status via PATCH endpoint.
     */
    public function test_superadmin_can_update_staff_status_via_patch(): void
    {
        $staff = Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Patch Status Staff',
            'email' => 'patch_' . uniqid() . '@company.com',
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->patchJson("/api/superadmin/staff/{$staff->id}/status", [
                'status' => 'inactive',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Staff member deactivated successfully.',
                'staff' => [
                    'id' => $staff->id,
                    'status' => 'inactive',
                    'is_active' => false,
                ],
            ]);
    }

    /**
     * 19. Pagination works.
     */
    public function test_pagination_works(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            Staff::create([
                'staff_code' => sprintf('STF-%04d', 5000 + $i),
                'name' => "Batch Staff Member {$i}",
                'email' => "batch_{$i}_" . uniqid() . '@company.com',
                'status' => 'active',
                'is_active' => true,
            ]);
        }

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff?per_page=5&page=1');

        $response->assertStatus(200)
            ->assertJson([
                'current_page' => 1,
                'per_page' => 5,
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    /**
     * 20. Department list endpoint returns unique departments.
     */
    public function test_departments_endpoint_returns_unique_list(): void
    {
        $uniqueDept = 'UniqueDept_' . uniqid();
        Staff::create([
            'staff_code' => Staff::generateUniqueCode(),
            'name' => 'Dept Member',
            'email' => 'dept_member_' . uniqid() . '@company.com',
            'department' => $uniqueDept,
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/staff/departments');

        $response->assertStatus(200);
        $this->assertContains($uniqueDept, $response->json());
    }

    /**
     * 21. Existing Superadmin authentication still works.
     */
    public function test_existing_superadmin_authentication_still_works(): void
    {
        $response = $this->postJson('/api/superadmin/login', [
            'email' => $this->superAdmin->email,
            'password' => 'SuperSecurePass@2026!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    /**
     * 22. Existing Admin Management continues working.
     */
    public function test_existing_admin_management_continues_working(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/admins', [
                'name' => 'Coexisting Admin',
                'email' => 'coexisting_' . uniqid() . '@company.com',
                'mobile' => '9999888877',
                'password' => 'AdminPassword123!',
                'password_confirmation' => 'AdminPassword123!',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('admins', [
            'name' => 'Coexisting Admin',
        ]);
    }
}
