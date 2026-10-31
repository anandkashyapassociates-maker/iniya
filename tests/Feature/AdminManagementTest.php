<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;

    protected string $superAdminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Master Super Admin',
            'email' => 'master@superadmin.com',
            'password' => Hash::make('SuperPass@2026!'),
            'is_active' => true,
        ]);

        $this->superAdminToken = $this->superAdmin->createToken('test-token', ['role:superadmin'])->plainTextToken;
    }

    /**
     * 1. Authenticated Superadmin can create an Admin.
     */
    public function test_authenticated_superadmin_can_create_an_admin(): void
    {
        $payload = [
            'name' => 'Operations Admin',
            'email' => 'ops@company.com',
            'mobile' => '+91 9876543210',
            'password' => 'AdminSecret123!',
            'password_confirmation' => 'AdminSecret123!',
            'is_active' => true,
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Admin account created successfully.',
                'admin' => [
                    'name' => 'Operations Admin',
                    'email' => 'ops@company.com',
                    'mobile' => '+91 9876543210',
                    'is_active' => true,
                ],
            ]);
    }

    /**
     * 2. Unauthenticated requests cannot create Admin accounts.
     */
    public function test_unauthenticated_requests_cannot_create_admin_accounts(): void
    {
        $payload = [
            'name' => 'Hacker Admin',
            'email' => 'hacker@company.com',
            'mobile' => '9999999999',
            'password' => 'Password123!',
        ];

        $response = $this->postJson('/api/superadmin/admins', $payload);

        $response->assertStatus(401);
    }

    /**
     * 3. Ordinary users cannot create Admin accounts.
     */
    public function test_ordinary_users_cannot_create_admin_accounts(): void
    {
        $user = User::create([
            'name' => 'Regular User',
            'email' => 'user@company.com',
            'password' => Hash::make('UserPass123!'),
        ]);

        $userToken = $user->createToken('user-token')->plainTextToken;

        $payload = [
            'name' => 'Unauthorized Admin',
            'email' => 'unauthorized@company.com',
            'mobile' => '8888888888',
            'password' => 'Password123!',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$userToken)
            ->postJson('/api/superadmin/admins', $payload);

        $response->assertStatus(403);
    }

    /**
     * 4. Duplicate email addresses are rejected.
     */
    public function test_duplicate_email_addresses_are_rejected(): void
    {
        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Existing Admin',
            'email' => 'duplicate@company.com',
            'mobile' => '1111111111',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        $payload = [
            'name' => 'Another Admin',
            'email' => 'duplicate@company.com',
            'mobile' => '2222222222',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 5. Invalid input is rejected.
     */
    public function test_invalid_input_is_rejected(): void
    {
        // Missing fields & invalid formats
        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', [
                'name' => '',
                'email' => 'not-an-email',
                'mobile' => '',
                'password' => 'short',
                'password_confirmation' => 'different',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'mobile', 'password']);
    }

    /**
     * 6. Passwords are stored as hashes.
     */
    public function test_passwords_are_stored_as_hashes(): void
    {
        $plainPassword = 'StrictlySecretPassword@123';

        $payload = [
            'name' => 'Hash Admin',
            'email' => 'hash@company.com',
            'mobile' => '9876543211',
            'password' => $plainPassword,
            'password_confirmation' => $plainPassword,
        ];

        $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        $admin = Admin::where('email', 'hash@company.com')->first();
        $this->assertNotNull($admin);

        // Verify raw database password is NOT plaintext
        $rawRecord = DB::table('admins')->where('id', $admin->id)->first();
        $this->assertNotEquals($plainPassword, $rawRecord->password);
        $this->assertTrue(Hash::check($plainPassword, $rawRecord->password));
    }

    /**
     * 7. Passwords and hashes are excluded from API responses.
     */
    public function test_passwords_and_hashes_are_excluded_from_api_responses(): void
    {
        $payload = [
            'name' => 'NoPasswordAdmin',
            'email' => 'nopass@company.com',
            'mobile' => '9876543212',
            'password' => 'SecretPassword@123',
            'password_confirmation' => 'SecretPassword@123',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        $json = $response->json();
        $this->assertArrayNotHasKey('password', $json['admin']);
        $this->assertArrayNotHasKey('password_confirmation', $json['admin']);

        // Check index list as well
        $listResponse = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins');

        foreach ($listResponse->json('data') as $adminRecord) {
            $this->assertArrayNotHasKey('password', $adminRecord);
        }
    }

    /**
     * 8. Admin creation stores records in the admins table.
     */
    public function test_admin_creation_stores_records_in_the_admins_table(): void
    {
        $payload = [
            'name' => 'Table Check Admin',
            'email' => 'table@company.com',
            'mobile' => '9876543213',
            'password' => 'SecretPassword@123',
            'password_confirmation' => 'SecretPassword@123',
            'is_active' => true,
        ];

        $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        $this->assertDatabaseHas('admins', [
            'name' => 'Table Check Admin',
            'email' => 'table@company.com',
            'mobile' => '9876543213',
            'is_active' => true,
        ]);
    }

    /**
     * 9. Admin credentials are not written into users or superadmins.
     */
    public function test_admin_credentials_are_not_written_into_users_or_superadmins(): void
    {
        $email = 'isolated_admin@company.com';

        $payload = [
            'name' => 'Isolated Admin',
            'email' => $email,
            'mobile' => '9876543214',
            'password' => 'SecretPassword@123',
            'password_confirmation' => 'SecretPassword@123',
        ];

        $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/admins', $payload);

        // Verify present in admins table
        $this->assertDatabaseHas('admins', ['email' => $email]);

        // Verify ABSENT from users and super_admins tables
        $this->assertDatabaseMissing('users', ['email' => $email]);
        $this->assertDatabaseMissing('super_admins', ['email' => $email]);
    }

    /**
     * 10. Admin listing returns the correct records.
     */
    public function test_admin_listing_returns_the_correct_records(): void
    {
        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Admin Alpha',
            'email' => 'alpha@company.com',
            'mobile' => '9876543215',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Admin Beta',
            'email' => 'beta@company.com',
            'mobile' => '9876543216',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'mobile', 'is_active', 'created_at', 'updated_at'],
                ],
                'current_page',
                'total',
            ]);

        $emails = collect($response->json('data'))->pluck('email')->toArray();
        $this->assertContains('alpha@company.com', $emails);
        $this->assertContains('beta@company.com', $emails);
    }

    /**
     * 11. Search filters records correctly.
     */
    public function test_search_filters_records_correctly(): void
    {
        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Special Name Rajesh',
            'email' => 'rajesh@unique.com',
            'mobile' => '9111111111',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Other Admin Suresh',
            'email' => 'suresh@domain.com',
            'mobile' => '9222222222',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        // Search by keyword in name
        $resName = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?search=Rajesh');
        $this->assertCount(1, $resName->json('data'));
        $this->assertEquals('rajesh@unique.com', $resName->json('data.0.email'));

        // Search by keyword in mobile
        $resMobile = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?search=9222222222');
        $this->assertCount(1, $resMobile->json('data'));
        $this->assertEquals('suresh@domain.com', $resMobile->json('data.0.email'));
    }

    /**
     * 12. Status filtering works.
     */
    public function test_status_filtering_works(): void
    {
        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Active Admin One',
            'email' => 'active1@company.com',
            'mobile' => '9333333331',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Inactive Admin Two',
            'email' => 'inactive2@company.com',
            'mobile' => '9333333332',
            'password' => Hash::make('Password123!'),
            'is_active' => false,
        ]);

        // Filter active only
        $resActive = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?status=true');
        $activeStatuses = collect($resActive->json('data'))->pluck('is_active')->unique()->toArray();
        $this->assertEquals([true], $activeStatuses);

        // Filter inactive only
        $resInactive = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?status=false');
        $inactiveStatuses = collect($resInactive->json('data'))->pluck('is_active')->unique()->toArray();
        $this->assertEquals([false], $inactiveStatuses);
    }

    /**
     * 13. Pagination works.
     */
    public function test_pagination_works(): void
    {
        for ($i = 1; $i <= 15; $i++) {
            Admin::create([
                'super_admin_id' => $this->superAdmin->id,
                'name' => "Admin Number {$i}",
                'email' => "admin{$i}@paginate.com",
                'mobile' => "944444400{$i}",
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ]);
        }

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?per_page=5&page=1');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(15, $response->json('total'));
        $this->assertEquals(3, $response->json('last_page'));
    }

    /**
     * 14. Unauthorized users cannot view Admin details.
     */
    public function test_unauthorized_users_cannot_view_admin_details(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Target Admin',
            'email' => 'target@company.com',
            'mobile' => '9555555555',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        // Unauthenticated
        $unauthRes = $this->getJson("/api/superadmin/admins/{$admin->id}");
        $unauthRes->assertStatus(401);

        // Standard ERP User
        $user = User::create([
            'name' => 'Standard Client',
            'email' => 'client@company.com',
            'password' => Hash::make('Password123!'),
        ]);
        $userToken = $user->createToken('token')->plainTextToken;

        $userRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
            ->getJson("/api/superadmin/admins/{$admin->id}");
        $userRes->assertStatus(403);
    }

    /**
     * 15. Missing Admin IDs return the correct response.
     */
    public function test_missing_admin_ids_return_the_correct_response(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins/999999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Admin account not found.',
            ]);
    }

    /**
     * 16. Existing Superadmin authentication still works.
     */
    public function test_existing_superadmin_authentication_still_works(): void
    {
        $response = $this->postJson('/api/superadmin/login', [
            'email' => $this->superAdmin->email,
            'password' => 'SuperPass@2026!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    /**
     * 17. Existing user authentication remains functional.
     */
    public function test_existing_user_authentication_remains_functional(): void
    {
        $user = User::create([
            'name' => 'Existing Customer',
            'email' => 'customer@company.com',
            'password' => Hash::make('CustomerPass123!'),
        ]);

        $token = $user->createToken('client-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'email' => 'customer@company.com',
            ]);
    }

    /**
     * 18. Superadmin can update admin status to blocked and tokens are immediately revoked.
     */
    public function test_superadmin_can_update_admin_status_to_blocked_and_tokens_are_revoked(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'To Be Blocked Admin',
            'email' => 'blockme@company.com',
            'mobile' => '9444444441',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
            'is_active' => true,
        ]);

        // Issue token
        $admin->createToken('admin-test-token');
        $this->assertEquals(1, $admin->tokens()->count());

        // Update status to blocked via PATCH /status
        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->patchJson("/api/superadmin/admins/{$admin->id}/status", [
                'status' => 'blocked',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Admin account blocked successfully.',
                'admin' => [
                    'id' => $admin->id,
                    'status' => 'blocked',
                    'is_active' => false,
                ],
            ]);

        $this->assertEquals(0, $admin->tokens()->count());
        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'status' => 'blocked',
            'is_active' => false,
        ]);
    }

    /**
     * 19. Blocked admin cannot log in and receives 403 access denied.
     */
    public function test_blocked_admin_cannot_login(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Blocked Administrator',
            'email' => 'blockedadmin@company.com',
            'mobile' => '9444444442',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'blocked',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'blockedadmin@company.com',
            'password' => 'AdminPass123!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your Admin account has been blocked by the Super Administrator. Access denied.',
            ]);
    }

    /**
     * 20. Inactive admin cannot log in and receives 403 deactivated notice.
     */
    public function test_inactive_admin_cannot_login(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Inactive Administrator',
            'email' => 'inactiveadmin@company.com',
            'mobile' => '9444444443',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'inactive',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'inactiveadmin@company.com',
            'password' => 'AdminPass123!',
            'turnstile_token' => 'dummy-test-token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your Admin account is deactivated. Please contact your Super Administrator.',
            ]);
    }

    /**
     * 21. Superadmin can edit admin details including name, mobile, and status via PUT endpoint.
     */
    public function test_superadmin_can_edit_admin_details_via_put(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Original Name',
            'email' => 'original@company.com',
            'mobile' => '9444444444',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->putJson("/api/superadmin/admins/{$admin->id}", [
                'name' => 'Updated Full Name',
                'email' => 'updated_email@company.com',
                'mobile' => '9555555555',
                'status' => 'blocked',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Admin account updated successfully.',
                'admin' => [
                    'id' => $admin->id,
                    'name' => 'Updated Full Name',
                    'email' => 'updated_email@company.com',
                    'mobile' => '9555555555',
                    'status' => 'blocked',
                    'is_active' => false,
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'name' => 'Updated Full Name',
            'email' => 'updated_email@company.com',
            'mobile' => '9555555555',
            'status' => 'blocked',
            'is_active' => false,
        ]);
    }

    /**
     * 22. Status filtering supports blocked status.
     */
    public function test_status_filtering_supports_blocked(): void
    {
        $blockedAdmin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Filter Blocked Admin',
            'email' => 'filterblocked@company.com',
            'mobile' => '9444444445',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'blocked',
            'is_active' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/admins?status=blocked');

        $response->assertStatus(200);
        $statuses = collect($response->json('data'))->pluck('status')->unique()->toArray();
        $this->assertEquals(['blocked'], $statuses);
    }

    /**
     * 23. SuperAdmin can impersonate an active admin and use the token to access admin panel.
     */
    public function test_superadmin_can_impersonate_active_admin(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Dr. Robert Smith',
            'email' => 'dr.robert@company.com',
            'mobile' => '9888877777',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson("/api/superadmin/admins/{$admin->id}/impersonate");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'is_active',
                ],
                'impersonated_by' => [
                    'superadmin_id',
                    'superadmin_name',
                ],
            ]);

        $token = $response->json('token');
        $this->assertNotEmpty($token);

        // Reset auth guard between requests in the test
        auth('sanctum')->forgetUser();

        // Verify the impersonation token can access admin routes
        $adminMeResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/me');

        $adminMeResponse->assertStatus(200)
            ->assertJsonPath('user.id', $admin->id)
            ->assertJsonPath('user.email', 'dr.robert@company.com');
    }

    /**
     * 24. SuperAdmin cannot impersonate a blocked or inactive admin.
     */
    public function test_superadmin_cannot_impersonate_blocked_or_inactive_admin(): void
    {
        $blockedAdmin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Blocked Admin',
            'email' => 'blocked@company.com',
            'mobile' => '9777788888',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'blocked',
            'is_active' => false,
        ]);

        $inactiveAdmin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Inactive Admin',
            'email' => 'inactive@company.com',
            'mobile' => '9666688888',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'inactive',
            'is_active' => false,
        ]);

        $resBlocked = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson("/api/superadmin/admins/{$blockedAdmin->id}/impersonate");
        $resBlocked->assertStatus(422)
            ->assertJsonPath('message', 'Cannot log in as a blocked Admin account. Please unblock the admin first.');

        $resInactive = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson("/api/superadmin/admins/{$inactiveAdmin->id}/impersonate");
        $resInactive->assertStatus(422)
            ->assertJsonPath('message', 'Cannot log in as an inactive Admin account. Please activate the admin first.');
    }
}
