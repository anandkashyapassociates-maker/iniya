<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SalesMember;
use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SalesMemberManagementTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;
    protected string $superAdminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Lead SuperAdmin',
            'email' => 'superadmin_sales_test_' . uniqid() . '@example.com',
            'password' => Hash::make('SuperSecurePass@2026!'),
            'is_active' => true,
        ]);

        $this->superAdminToken = $this->superAdmin->createToken('superadmin-test-token', ['role:superadmin'])->plainTextToken;
    }

    /**
     * 1. Unauthenticated requests cannot list Sales Members.
     */
    public function test_unauthenticated_requests_cannot_list_sales_members(): void
    {
        $response = $this->getJson('/api/superadmin/sales-members');
        $response->assertStatus(401);
    }

    /**
     * 2. Unauthenticated requests cannot create Sales Members.
     */
    public function test_unauthenticated_requests_cannot_create_sales_members(): void
    {
        $response = $this->postJson('/api/superadmin/sales-members', [
            'name' => 'Unauth Sales Member',
            'email' => 'unauth@sales.com',
            'mobile' => '9876543210',
        ]);
        $response->assertStatus(401);
    }

    /**
     * 3. Unauthenticated requests cannot update Sales Members.
     */
    public function test_unauthenticated_requests_cannot_update_sales_members(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-9001',
            'name' => 'Existing Member',
            'email' => 'existing_' . uniqid() . '@sales.com',
            'mobile' => '9876543210',
        ]);

        $response = $this->putJson('/api/superadmin/sales-members/' . $member->id, [
            'name' => 'Attempted Update',
            'email' => $member->email,
            'mobile' => $member->mobile,
        ]);
        $response->assertStatus(401);
    }

    /**
     * 4. Admin token cannot access Sales Member Superadmin APIs.
     */
    public function test_admin_token_cannot_access_sales_member_superadmin_apis(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Operational Admin',
            'email' => 'admin_sales_test_' . uniqid() . '@example.com',
            'password' => Hash::make('AdminPass@2026!'),
            'is_active' => true,
        ]);

        $adminToken = $admin->createToken('admin-test-token', ['role:admin'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/superadmin/sales-members');

        $response->assertStatus(403);
    }

    /**
     * 5. Invalid authentication is rejected.
     */
    public function test_invalid_authentication_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-sample')
            ->getJson('/api/superadmin/sales-members');

        $response->assertStatus(401);
    }

    /**
     * 6. Valid Sales Member can be created.
     */
    public function test_valid_sales_member_can_be_created(): void
    {
        $payload = [
            'name' => 'Aarav Singhania',
            'email' => 'aarav_' . uniqid() . '@salescorp.com',
            'mobile' => '9876543210',
            'alternate_mobile' => '9876500000',
            'gender' => 'Male',
            'designation' => 'Area Sales Executive',
            'department' => 'Enterprise Sales',
            'employment_type' => 'Full-Time',
            'joining_date' => '2026-02-01',
            'territory' => 'North Zone',
            'city' => 'Gurugram',
            'state' => 'Haryana',
            'country' => 'India',
            'address' => 'Tower B, Cyber City, Sector 24',
            'notes' => 'Top performer for Q1 targets',
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'sales_member' => [
                    'id',
                    'sales_code',
                    'name',
                    'email',
                    'mobile',
                    'designation',
                    'department',
                    'territory',
                    'status',
                    'created_by_superadmin_id',
                ],
            ]);

        $salesCode = $response->json('sales_member.sales_code');
        $this->assertStringStartsWith('SAL-', $salesCode);
    }

    /**
     * 7. Record is saved in sales_members table.
     */
    public function test_record_is_saved_in_sales_members(): void
    {
        $email = 'saved_' . uniqid() . '@sales.com';

        $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Database Check Member',
                'email' => $email,
                'mobile' => '9111122222',
                'department' => 'B2B Sales',
            ]);

        $this->assertDatabaseHas('sales_members', [
            'email' => $email,
            'department' => 'B2B Sales',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);
    }

    /**
     * 8. No record is inserted into other tables (table isolation).
     */
    public function test_no_record_is_inserted_into_staff_admins_vendors_customers_or_users(): void
    {
        $email = 'isolated_sales_' . uniqid() . '@sales.com';

        $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Isolated Sales Member',
                'email' => $email,
                'mobile' => '9888877777',
            ]);

        $this->assertDatabaseHas('sales_members', ['email' => $email]);
        $this->assertDatabaseMissing('staff', ['email' => $email]);
        $this->assertDatabaseMissing('admins', ['email' => $email]);
        $this->assertDatabaseMissing('vendors', ['email' => $email]);
        $this->assertDatabaseMissing('customers', ['email' => $email]);
        $this->assertDatabaseMissing('users', ['email' => $email]);
        $this->assertDatabaseMissing('super_admins', ['email' => $email]);
    }

    /**
     * 9. Sales Code is generated automatically with SAL- prefix.
     */
    public function test_sales_code_is_generated_automatically_with_sal_prefix(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Prefix Check Member',
                'email' => 'prefix_' . uniqid() . '@sales.com',
                'mobile' => '9222233333',
            ]);

        $response->assertStatus(201);
        $code = $response->json('sales_member.sales_code');
        $this->assertMatchesRegularExpression('/^SAL-\d{4,}$/', $code);
    }

    /**
     * 10. Sequential sales codes are incremented properly.
     */
    public function test_sequential_sales_codes_are_incremented_properly(): void
    {
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Member Alpha',
                'email' => 'alpha_' . uniqid() . '@sales.com',
                'mobile' => '9333344441',
            ]);
        $code1 = $res1->json('sales_member.sales_code');

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Member Beta',
                'email' => 'beta_' . uniqid() . '@sales.com',
                'mobile' => '9333344442',
            ]);
        $code2 = $res2->json('sales_member.sales_code');

        $num1 = (int) substr($code1, 4);
        $num2 = (int) substr($code2, 4);

        $this->assertEquals($num1 + 1, $num2);
    }

    /**
     * 11. Duplicate email is rejected.
     */
    public function test_duplicate_email_is_rejected(): void
    {
        $email = 'duplicate_' . uniqid() . '@sales.com';

        SalesMember::create([
            'sales_code' => 'SAL-9981',
            'name' => 'First Holder',
            'email' => $email,
            'mobile' => '9444455551',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Second Holder',
                'email' => $email,
                'mobile' => '9444455552',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 12. Missing required fields are rejected.
     */
    public function test_missing_required_fields_are_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'mobile']);
    }

    /**
     * 13. Invalid field lengths are rejected.
     */
    public function test_invalid_field_lengths_are_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => str_repeat('A', 151),
                'email' => 'length_test_' . uniqid() . '@sales.com',
                'mobile' => str_repeat('9', 25),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'mobile']);
    }

    /**
     * 14. Default status is active.
     */
    public function test_default_status_is_active(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'name' => 'Default Status Member',
                'email' => 'default_status_' . uniqid() . '@sales.com',
                'mobile' => '9555566666',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('active', $response->json('sales_member.status'));
    }

    /**
     * 15. Protected fields cannot be manipulated on creation.
     */
    public function test_protected_fields_cannot_be_manipulated_on_creation(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/sales-members', [
                'sales_code' => 'SAL-9999',
                'created_by_superadmin_id' => 999999,
                'name' => 'Security Check Member',
                'email' => 'security_check_' . uniqid() . '@sales.com',
                'mobile' => '9666677777',
            ]);

        $response->assertStatus(201);
        $this->assertNotEquals('SAL-9999', $response->json('sales_member.sales_code'));
        $this->assertEquals($this->superAdmin->id, $response->json('sales_member.created_by_superadmin_id'));
    }

    /**
     * 16. Invalid profile photos are rejected.
     */
    public function test_invalid_profile_photos_are_rejected(): void
    {
        Storage::fake('public');

        $fakeFile = UploadedFile::fake()->create('malicious.php', 100, 'text/php');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->post('/api/superadmin/sales-members', [
                'name' => 'Photo Test Member',
                'email' => 'photo_test_' . uniqid() . '@sales.com',
                'mobile' => '9777788888',
                'profile_photo' => $fakeFile,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['profile_photo']);
    }

    /**
     * 17. Sales members can be listed.
     */
    public function test_sales_members_can_be_listed(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-0101',
            'name' => 'Listing Member 1',
            'email' => 'list1_' . uniqid() . '@sales.com',
            'mobile' => '9000010001',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'current_page', 'total']);
    }

    /**
     * 18. Search works by sales code.
     */
    public function test_search_works_by_sales_code(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7777',
            'name' => 'Search Code Target',
            'email' => 'search_code_' . uniqid() . '@sales.com',
            'mobile' => '9000007777',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=SAL-7777');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('sales_code', 'SAL-7777'));
    }

    /**
     * 19. Search works by name.
     */
    public function test_search_works_by_name(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7778',
            'name' => 'ValkyrieRepresentative',
            'email' => 'valkyrie_' . uniqid() . '@sales.com',
            'mobile' => '9000007778',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=Valkyrie');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('name', 'ValkyrieRepresentative'));
    }

    /**
     * 20. Search works by email.
     */
    public function test_search_works_by_email(): void
    {
        $uniqueEmail = 'target_email_' . uniqid() . '@sales.com';

        SalesMember::create([
            'sales_code' => 'SAL-7779',
            'name' => 'Email Target Member',
            'email' => $uniqueEmail,
            'mobile' => '9000007779',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=' . $uniqueEmail);

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('email', $uniqueEmail));
    }

    /**
     * 21. Search works by mobile.
     */
    public function test_search_works_by_mobile(): void
    {
        $uniqueMobile = '9988776655';

        SalesMember::create([
            'sales_code' => 'SAL-7780',
            'name' => 'Mobile Target Member',
            'email' => 'mobile_target_' . uniqid() . '@sales.com',
            'mobile' => $uniqueMobile,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=' . $uniqueMobile);

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('mobile', $uniqueMobile));
    }

    /**
     * 22. Search works by designation.
     */
    public function test_search_works_by_designation(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7781',
            'name' => 'Designation Target Member',
            'email' => 'designation_target_' . uniqid() . '@sales.com',
            'mobile' => '9000007781',
            'designation' => 'Principal Account Strategist',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=Strategist');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('designation', 'Principal Account Strategist'));
    }

    /**
     * 23. Search works by department.
     */
    public function test_search_works_by_department(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7782',
            'name' => 'Dept Target Member',
            'email' => 'dept_target_' . uniqid() . '@sales.com',
            'mobile' => '9000007782',
            'department' => 'Global Expansion Team',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=Expansion');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('department', 'Global Expansion Team'));
    }

    /**
     * 24. Search works by territory.
     */
    public function test_search_works_by_territory(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7783',
            'name' => 'Territory Target Member',
            'email' => 'territory_target_' . uniqid() . '@sales.com',
            'mobile' => '9000007783',
            'territory' => 'Scandinavia Sector',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=Scandinavia');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('territory', 'Scandinavia Sector'));
    }

    /**
     * 25. Search works by city.
     */
    public function test_search_works_by_city(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-7784',
            'name' => 'City Target Member',
            'email' => 'city_target_' . uniqid() . '@sales.com',
            'mobile' => '9000007784',
            'city' => 'Hyderabad',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=Hyderabad');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('city', 'Hyderabad'));
    }

    /**
     * 26. Status filtering works.
     */
    public function test_status_filtering_works(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-8001',
            'name' => 'Active Member',
            'email' => 'active_' . uniqid() . '@sales.com',
            'mobile' => '9000008001',
            'status' => 'active',
        ]);

        SalesMember::create([
            'sales_code' => 'SAL-8002',
            'name' => 'Blocked Member',
            'email' => 'blocked_' . uniqid() . '@sales.com',
            'mobile' => '9000008002',
            'status' => 'blocked',
        ]);

        $resActive = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?status=active');
        $resActive->assertStatus(200);
        $this->assertTrue(collect($resActive->json('data'))->every(fn ($m) => $m['status'] === 'active'));

        $resBlocked = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?status=blocked');
        $resBlocked->assertStatus(200);
        $this->assertTrue(collect($resBlocked->json('data'))->every(fn ($m) => $m['status'] === 'blocked'));
    }

    /**
     * 27. Department filtering works.
     */
    public function test_department_filtering_works(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-8011',
            'name' => 'Retail Member',
            'email' => 'retail_' . uniqid() . '@sales.com',
            'mobile' => '9000008011',
            'department' => 'Retail Sales',
        ]);

        SalesMember::create([
            'sales_code' => 'SAL-8012',
            'name' => 'Direct Member',
            'email' => 'direct_' . uniqid() . '@sales.com',
            'mobile' => '9000008012',
            'department' => 'Direct Sales',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?department=Retail Sales');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->every(fn ($m) => $m['department'] === 'Retail Sales'));
    }

    /**
     * 28. Employment Type filtering works.
     */
    public function test_employment_type_filtering_works(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-8021',
            'name' => 'Commission Member',
            'email' => 'comm_' . uniqid() . '@sales.com',
            'mobile' => '9000008021',
            'employment_type' => 'Commission-Based',
        ]);

        SalesMember::create([
            'sales_code' => 'SAL-8022',
            'name' => 'FullTime Member',
            'email' => 'full_' . uniqid() . '@sales.com',
            'mobile' => '9000008022',
            'employment_type' => 'Full-Time',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?employment_type=Commission-Based');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->every(fn ($m) => $m['employment_type'] === 'Commission-Based'));
    }

    /**
     * 29. Territory filtering works.
     */
    public function test_territory_filtering_works(): void
    {
        SalesMember::create([
            'sales_code' => 'SAL-8031',
            'name' => 'North Member',
            'email' => 'north_' . uniqid() . '@sales.com',
            'mobile' => '9000008031',
            'territory' => 'North Zone',
        ]);

        SalesMember::create([
            'sales_code' => 'SAL-8032',
            'name' => 'South Member',
            'email' => 'south_' . uniqid() . '@sales.com',
            'mobile' => '9000008032',
            'territory' => 'South Zone',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?territory=North Zone');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->every(fn ($m) => $m['territory'] === 'North Zone'));
    }

    /**
     * 30. Pagination works.
     */
    public function test_pagination_works(): void
    {
        for ($i = 1; $i <= 4; $i++) {
            SalesMember::create([
                'sales_code' => 'SAL-810' . $i,
                'name' => "Paginated Member {$i}",
                'email' => "paged_{$i}_" . uniqid() . '@sales.com',
                'mobile' => "900000810{$i}",
            ]);
        }

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?per_page=2');

        $response->assertStatus(200)
            ->assertJsonPath('per_page', 2)
            ->assertJsonPath('total', 4);

        $this->assertCount(2, $response->json('data'));
    }

    /**
     * 31. Empty results are handled correctly.
     */
    public function test_empty_results_are_handled_correctly(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members?search=NonExistentQueryXYZ123');

        $response->assertStatus(200)
            ->assertJsonPath('total', 0);
        $this->assertCount(0, $response->json('data'));
    }

    /**
     * 32. NULL fields do not break API responses.
     */
    public function test_null_fields_do_not_break_api_responses(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8201',
            'name' => 'Minimal Sales Member',
            'email' => 'minimal_' . uniqid() . '@sales.com',
            'mobile' => '9000008201',
            // Nullable fields
            'alternate_mobile' => null,
            'gender' => null,
            'profile_photo' => null,
            'designation' => null,
            'department' => null,
            'employment_type' => null,
            'joining_date' => null,
            'territory' => null,
            'city' => null,
            'state' => null,
            'address' => null,
            'notes' => null,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members/' . $member->id);

        $response->assertStatus(200)
            ->assertJsonPath('sales_member.name', 'Minimal Sales Member')
            ->assertJsonPath('sales_member.designation', null);
    }

    /**
     * 33. Existing Sales Member can be updated.
     */
    public function test_existing_sales_member_can_be_updated(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8301',
            'name' => 'Initial Name',
            'email' => 'initial_' . uniqid() . '@sales.com',
            'mobile' => '9000008301',
            'designation' => 'Junior Rep',
            'status' => 'active',
        ]);

        $updatePayload = [
            'name' => 'Senior Promoted Rep',
            'email' => 'senior_' . uniqid() . '@sales.com',
            'mobile' => '9999900000',
            'designation' => 'Lead Sales Consultant',
            'status' => 'inactive',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $member->id, $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('sales_member.name', 'Senior Promoted Rep')
            ->assertJsonPath('sales_member.designation', 'Lead Sales Consultant')
            ->assertJsonPath('sales_member.status', 'inactive');

        $this->assertDatabaseHas('sales_members', [
            'id' => $member->id,
            'name' => 'Senior Promoted Rep',
            'status' => 'inactive',
        ]);
    }

    /**
     * 34. Sales Code cannot be changed.
     */
    public function test_sales_code_cannot_be_changed(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8311',
            'name' => 'Code Immutable Member',
            'email' => 'immutable_' . uniqid() . '@sales.com',
            'mobile' => '9000008311',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $member->id, [
                'sales_code' => 'SAL-9999',
                'name' => 'Code Immutable Member Updated',
                'email' => $member->email,
                'mobile' => $member->mobile,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('sales_members', [
            'id' => $member->id,
            'sales_code' => 'SAL-8311',
        ]);
        $this->assertDatabaseMissing('sales_members', [
            'id' => $member->id,
            'sales_code' => 'SAL-9999',
        ]);
    }

    /**
     * 35. Duplicate email updates are rejected.
     */
    public function test_duplicate_email_updates_are_rejected(): void
    {
        $existingEmail = 'taken_' . uniqid() . '@sales.com';
        SalesMember::create([
            'sales_code' => 'SAL-8321',
            'name' => 'Taken Email Member',
            'email' => $existingEmail,
            'mobile' => '9000008321',
        ]);

        $targetMember = SalesMember::create([
            'sales_code' => 'SAL-8322',
            'name' => 'Target Update Member',
            'email' => 'target_' . uniqid() . '@sales.com',
            'mobile' => '9000008322',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $targetMember->id, [
                'name' => 'Target Update Member',
                'email' => $existingEmail,
                'mobile' => '9000008322',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 36. Same email on own record update is allowed.
     */
    public function test_same_email_on_own_record_update_is_allowed(): void
    {
        $email = 'own_email_' . uniqid() . '@sales.com';
        $member = SalesMember::create([
            'sales_code' => 'SAL-8331',
            'name' => 'Own Email Member',
            'email' => $email,
            'mobile' => '9000008331',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $member->id, [
                'name' => 'Own Email Member Updated',
                'email' => $email,
                'mobile' => '9000008331',
            ]);

        $response->assertStatus(200);
    }

    /**
     * 37. Invalid status updates are rejected.
     */
    public function test_invalid_status_updates_are_rejected(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8341',
            'name' => 'Status Check Member',
            'email' => 'status_check_' . uniqid() . '@sales.com',
            'mobile' => '9000008341',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->patchJson('/api/superadmin/sales-members/' . $member->id . '/status', [
                'status' => 'illegal_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * 38. Protected fields cannot be modified via update.
     */
    public function test_protected_fields_cannot_be_modified_via_update(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8351',
            'name' => 'Protected Update Member',
            'email' => 'protected_' . uniqid() . '@sales.com',
            'mobile' => '9000008351',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $member->id, [
                'name' => 'Protected Update Member',
                'email' => $member->email,
                'mobile' => $member->mobile,
                'created_by_superadmin_id' => 999999,
            ]);

        $response->assertStatus(200);
        $this->assertEquals($this->superAdmin->id, $member->fresh()->created_by_superadmin_id);
    }

    /**
     * 39. Nonexistent Sales Member returns HTTP 404.
     */
    public function test_nonexistent_sales_member_returns_http_404(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members/9999999');

        $response->assertStatus(404);
    }

    /**
     * 40. Updating Sales Member does not modify unrelated records.
     */
    public function test_updating_sales_member_does_not_modify_unrelated_records(): void
    {
        $unrelated = SalesMember::create([
            'sales_code' => 'SAL-8361',
            'name' => 'Unrelated Member',
            'email' => 'unrelated_' . uniqid() . '@sales.com',
            'mobile' => '9000008361',
            'status' => 'active',
        ]);

        $target = SalesMember::create([
            'sales_code' => 'SAL-8362',
            'name' => 'Target Member',
            'email' => 'target_' . uniqid() . '@sales.com',
            'mobile' => '9000008362',
            'status' => 'active',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/sales-members/' . $target->id, [
                'name' => 'Target Member Changed',
                'email' => 'target_changed_' . uniqid() . '@sales.com',
                'mobile' => '9000008362',
                'status' => 'blocked',
            ]);

        $this->assertEquals('active', $unrelated->fresh()->status);
        $this->assertEquals('Unrelated Member', $unrelated->fresh()->name);
    }

    /**
     * 41. Superadmin can update sales member status.
     */
    public function test_superadmin_can_update_sales_member_status(): void
    {
        $member = SalesMember::create([
            'sales_code' => 'SAL-8371',
            'name' => 'Status Toggle Member',
            'email' => 'toggle_' . uniqid() . '@sales.com',
            'mobile' => '9000008371',
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->patchJson('/api/superadmin/sales-members/' . $member->id . '/status', [
                'status' => 'blocked',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('sales_member.status', 'blocked');

        $this->assertDatabaseHas('sales_members', [
            'id' => $member->id,
            'status' => 'blocked',
        ]);
    }

    /**
     * 42. Preview code endpoint returns next sequential code.
     */
    public function test_preview_code_endpoint_returns_next_sequential_code(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members/preview-code');

        $response->assertStatus(200)
            ->assertJsonStructure(['preview_code']);

        $code = $response->json('preview_code');
        $this->assertMatchesRegularExpression('/^SAL-\d{4,}$/', $code);
    }

    /**
     * 43. Departments endpoint returns available departments.
     */
    public function test_departments_endpoint_returns_available_departments(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members/departments');

        $response->assertStatus(200)
            ->assertJsonStructure(['departments']);

        $departments = $response->json('departments');
        $this->assertIsArray($departments);
        $this->assertContains('Enterprise Sales', $departments);
    }

    /**
     * 44. Territories endpoint returns available territories.
     */
    public function test_territories_endpoint_returns_available_territories(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/sales-members/territories');

        $response->assertStatus(200)
            ->assertJsonStructure(['territories']);

        $territories = $response->json('territories');
        $this->assertIsArray($territories);
        $this->assertContains('North Zone', $territories);
    }
}

