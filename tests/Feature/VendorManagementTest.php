<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class VendorManagementTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;
    protected string $superAdminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Lead SuperAdmin',
            'email' => 'superadmin_vendor_test_' . uniqid() . '@example.com',
            'password' => Hash::make('SuperSecurePass@2026!'),
            'is_active' => true,
        ]);

        $this->superAdminToken = $this->superAdmin->createToken('superadmin-test-token', ['role:superadmin'])->plainTextToken;
    }

    /**
     * 1. Unauthenticated request cannot access vendor listing.
     */
    public function test_unauthenticated_request_cannot_access_vendor_index(): void
    {
        $response = $this->getJson('/api/superadmin/vendors');
        $response->assertStatus(401);
    }

    /**
     * 2. Unauthenticated request cannot create vendor.
     */
    public function test_unauthenticated_request_cannot_create_vendor(): void
    {
        $response = $this->postJson('/api/superadmin/vendors', [
            'vendor_name' => 'Unauth Vendor',
            'email' => 'unauth@vendor.com',
            'mobile' => '9876543210',
        ]);
        $response->assertStatus(401);
    }

    /**
     * 3. Admin token cannot access superadmin vendor endpoints.
     */
    public function test_admin_token_cannot_access_superadmin_vendor_endpoints(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Operational Admin',
            'email' => 'admin_vendor_test_' . uniqid() . '@example.com',
            'password' => Hash::make('AdminPass@2026!'),
            'is_active' => true,
        ]);

        $adminToken = $admin->createToken('admin-test-token', ['role:admin'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/superadmin/vendors');

        $response->assertStatus(403);
    }

    /**
     * 4. Regular user token cannot access superadmin vendor endpoints.
     */
    public function test_regular_user_token_cannot_access_superadmin_vendor_endpoints(): void
    {
        $user = User::factory()->create();
        $userToken = $user->createToken('user-test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/superadmin/vendors');

        $response->assertStatus(403);
    }

    /**
     * 5. Superadmin can create valid vendor.
     */
    public function test_superadmin_can_create_valid_vendor(): void
    {
        $payload = [
            'vendor_name' => 'Apex Industrial Solutions',
            'company_name' => 'Apex Global Corp Ltd',
            'email' => 'contact_' . uniqid() . '@apex.com',
            'mobile' => '9876543210',
            'alternate_mobile' => '9876500000',
            'vendor_type' => 'Supplier',
            'gst_number' => '27ABCDE1234F1Z5',
            'pan_number' => 'ABCDE1234F',
            'address' => 'Plot 45, MIDC Industrial Area',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'postal_code' => '411018',
            'country' => 'India',
            'contact_person' => 'Rajesh Sharma',
            'notes' => 'Preferred vendor for heavy machinery parts',
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'vendor' => [
                    'id',
                    'vendor_code',
                    'vendor_name',
                    'company_name',
                    'email',
                    'mobile',
                    'vendor_type',
                    'gst_number',
                    'pan_number',
                    'status',
                    'created_by_superadmin_id',
                ],
            ]);

        $vendorCode = $response->json('vendor.vendor_code');
        $this->assertStringStartsWith('VEN-', $vendorCode);
    }

    /**
     * 6. Vendor record is isolated strictly in vendors table.
     */
    public function test_vendor_record_is_created_in_vendors_table_only(): void
    {
        $email = 'isolated_' . uniqid() . '@vendor.com';

        $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Isolated Supplies',
                'email' => $email,
                'mobile' => '9876543210',
            ]);

        $this->assertDatabaseHas('vendors', ['email' => $email]);
        $this->assertDatabaseMissing('super_admins', ['email' => $email]);
        $this->assertDatabaseMissing('admins', ['email' => $email]);
        $this->assertDatabaseMissing('staff', ['email' => $email]);
        $this->assertDatabaseMissing('users', ['email' => $email]);
    }

    /**
     * 7. Vendor code is automatically assigned with VEN- prefix.
     */
    public function test_vendor_code_is_automatically_assigned_with_ven_prefix(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Alpha Supplies',
                'email' => 'alpha_' . uniqid() . '@supplies.com',
                'mobile' => '9111122222',
            ]);

        $response->assertStatus(201);
        $code = $response->json('vendor.vendor_code');
        $this->assertMatchesRegularExpression('/^VEN-\d{4,}$/', $code);
    }

    /**
     * 8. Sequential vendor codes are incremented properly.
     */
    public function test_sequential_vendor_codes_are_incremented_properly(): void
    {
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'First Vendor',
                'email' => 'first_' . uniqid() . '@vendor.com',
                'mobile' => '9111100001',
            ]);
        $code1 = $res1->json('vendor.vendor_code');

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Second Vendor',
                'email' => 'second_' . uniqid() . '@vendor.com',
                'mobile' => '9111100002',
            ]);
        $code2 = $res2->json('vendor.vendor_code');

        $num1 = (int) substr($code1, 4);
        $num2 = (int) substr($code2, 4);

        $this->assertEquals($num1 + 1, $num2);
    }

    /**
     * 9. Superadmin ID is recorded as creator.
     */
    public function test_superadmin_id_is_recorded_as_creator(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Creator Check Vendor',
                'email' => 'creator_' . uniqid() . '@vendor.com',
                'mobile' => '9222233333',
            ]);

        $response->assertStatus(201);
        $this->assertEquals($this->superAdmin->id, $response->json('vendor.created_by_superadmin_id'));
    }

    /**
     * 10. Duplicate email is rejected with 422.
     */
    public function test_duplicate_email_is_rejected(): void
    {
        $email = 'duplicate_' . uniqid() . '@vendor.com';

        Vendor::create([
            'vendor_code' => 'VEN-9991',
            'vendor_name' => 'Vendor 1',
            'email' => $email,
            'mobile' => '9000000001',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Vendor 2',
                'email' => $email,
                'mobile' => '9000000002',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 11. Duplicate GST number is rejected with 422.
     */
    public function test_duplicate_gst_number_is_rejected(): void
    {
        $gst = '27AABCT1234F1Z0';

        Vendor::create([
            'vendor_code' => 'VEN-9992',
            'vendor_name' => 'GST Vendor 1',
            'email' => 'gst1_' . uniqid() . '@vendor.com',
            'mobile' => '9000000011',
            'gst_number' => $gst,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'GST Vendor 2',
                'email' => 'gst2_' . uniqid() . '@vendor.com',
                'mobile' => '9000000012',
                'gst_number' => $gst,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gst_number']);
    }

    /**
     * 12. Multiple vendors can have null GST number.
     */
    public function test_multiple_vendors_can_have_null_gst_number(): void
    {
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Null GST 1',
                'email' => 'nullgst1_' . uniqid() . '@vendor.com',
                'mobile' => '9000000021',
                'gst_number' => null,
            ]);
        $res1->assertStatus(201);

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Null GST 2',
                'email' => 'nullgst2_' . uniqid() . '@vendor.com',
                'mobile' => '9000000022',
                'gst_number' => '',
            ]);
        $res2->assertStatus(201);
    }

    /**
     * 13. Vendor name is required.
     */
    public function test_vendor_name_is_required(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => '',
                'email' => 'valid_' . uniqid() . '@vendor.com',
                'mobile' => '9876543210',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['vendor_name']);
    }

    /**
     * 14. Email is required.
     */
    public function test_email_is_required(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Valid Vendor',
                'email' => '',
                'mobile' => '9876543210',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 15. Mobile is required.
     */
    public function test_mobile_is_required(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Valid Vendor',
                'email' => 'valid_' . uniqid() . '@vendor.com',
                'mobile' => '',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mobile']);
    }

    /**
     * 16. Default status is active if omitted.
     */
    public function test_default_status_is_active_if_omitted(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/superadmin/vendors', [
                'vendor_name' => 'Default Status Vendor',
                'email' => 'default_status_' . uniqid() . '@vendor.com',
                'mobile' => '9876543210',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('active', $response->json('vendor.status'));
    }

    /**
     * 17. Superadmin can list paginated vendors.
     */
    public function test_superadmin_can_list_paginated_vendors(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            Vendor::create([
                'vendor_code' => 'VEN-010' . $i,
                'vendor_name' => "Batch Vendor {$i}",
                'email' => "batch_{$i}_" . uniqid() . '@vendor.com',
                'mobile' => "900000010{$i}",
                'status' => 'active',
            ]);
        }

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?per_page=2');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'total',
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    /**
     * 18. Search by vendor code.
     */
    public function test_superadmin_can_search_vendors_by_vendor_code(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-7777',
            'vendor_name' => 'Target Search Code Vendor',
            'email' => 'target_code_' . uniqid() . '@vendor.com',
            'mobile' => '9000007777',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?search=VEN-7777');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('vendor_code', 'VEN-7777'));
    }

    /**
     * 19. Search by vendor name.
     */
    public function test_superadmin_can_search_vendors_by_vendor_name(): void
    {
        Vendor::create([
            'vendor_code' => 'VEN-8888',
            'vendor_name' => 'UniqueZirconiumSupplier',
            'email' => 'zirconium_' . uniqid() . '@vendor.com',
            'mobile' => '9000008888',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?search=UniqueZirconium');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('vendor_name', 'UniqueZirconiumSupplier'));
    }

    /**
     * 20. Search by company name.
     */
    public function test_superadmin_can_search_vendors_by_company_name(): void
    {
        Vendor::create([
            'vendor_code' => 'VEN-8889',
            'vendor_name' => 'Solar Dealer',
            'company_name' => 'Hyperion Helios Industries',
            'email' => 'hyperion_' . uniqid() . '@vendor.com',
            'mobile' => '9000008889',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?search=Hyperion');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('company_name', 'Hyperion Helios Industries'));
    }

    /**
     * 21. Search by email.
     */
    public function test_superadmin_can_search_vendors_by_email(): void
    {
        $uniqueEmail = 'quarks_' . uniqid() . '@vendor.com';

        Vendor::create([
            'vendor_code' => 'VEN-8890',
            'vendor_name' => 'Quarks Tech',
            'email' => $uniqueEmail,
            'mobile' => '9000008890',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?search=' . $uniqueEmail);

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('email', $uniqueEmail));
    }

    /**
     * 22. Search by GST number.
     */
    public function test_superadmin_can_search_vendors_by_gst_number(): void
    {
        $gst = '07AAAAA0000A1Z5';

        Vendor::create([
            'vendor_code' => 'VEN-8891',
            'vendor_name' => 'GST Target Vendor',
            'email' => 'gsttarget_' . uniqid() . '@vendor.com',
            'mobile' => '9000008891',
            'gst_number' => $gst,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?search=' . $gst);

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('gst_number', $gst));
    }

    /**
     * 23. Filter vendors by status.
     */
    public function test_superadmin_can_filter_vendors_by_status(): void
    {
        Vendor::create([
            'vendor_code' => 'VEN-9001',
            'vendor_name' => 'Active Test Vendor',
            'email' => 'active_' . uniqid() . '@vendor.com',
            'mobile' => '9000009001',
            'status' => 'active',
        ]);

        Vendor::create([
            'vendor_code' => 'VEN-9002',
            'vendor_name' => 'Blocked Test Vendor',
            'email' => 'blocked_' . uniqid() . '@vendor.com',
            'mobile' => '9000009002',
            'status' => 'blocked',
        ]);

        $responseActive = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?status=active');
        $responseActive->assertStatus(200);
        $this->assertTrue(collect($responseActive->json('data'))->every(fn ($v) => $v['status'] === 'active'));

        $responseBlocked = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?status=blocked');
        $responseBlocked->assertStatus(200);
        $this->assertTrue(collect($responseBlocked->json('data'))->every(fn ($v) => $v['status'] === 'blocked'));
    }

    /**
     * 24. Filter vendors by vendor_type.
     */
    public function test_superadmin_can_filter_vendors_by_vendor_type(): void
    {
        Vendor::create([
            'vendor_code' => 'VEN-9011',
            'vendor_name' => 'Contractor Test',
            'email' => 'contractor_' . uniqid() . '@vendor.com',
            'mobile' => '9000009011',
            'vendor_type' => 'Contractor',
        ]);

        Vendor::create([
            'vendor_code' => 'VEN-9012',
            'vendor_name' => 'Manufacturer Test',
            'email' => 'mfg_' . uniqid() . '@vendor.com',
            'mobile' => '9000009012',
            'vendor_type' => 'Manufacturer',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors?vendor_type=Contractor');

        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->every(fn ($v) => $v['vendor_type'] === 'Contractor'));
    }

    /**
     * 25. View single vendor.
     */
    public function test_superadmin_can_view_single_vendor(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-9021',
            'vendor_name' => 'Single View Vendor',
            'email' => 'single_' . uniqid() . '@vendor.com',
            'mobile' => '9000009021',
            'company_name' => 'Single Co.',
            'city' => 'Bengaluru',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors/' . $vendor->id);

        $response->assertStatus(200)
            ->assertJsonPath('vendor.vendor_name', 'Single View Vendor')
            ->assertJsonPath('vendor.city', 'Bengaluru');
    }

    /**
     * 26. Superadmin can update vendor details.
     */
    public function test_superadmin_can_update_vendor_details(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-9031',
            'vendor_name' => 'Original Name',
            'email' => 'original_' . uniqid() . '@vendor.com',
            'mobile' => '9000009031',
            'city' => 'Delhi',
            'status' => 'active',
        ]);

        $updatePayload = [
            'vendor_name' => 'Updated Name Inc',
            'email' => 'updated_' . uniqid() . '@vendor.com',
            'mobile' => '9999988888',
            'city' => 'New Delhi',
            'status' => 'inactive',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/vendors/' . $vendor->id, $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('vendor.vendor_name', 'Updated Name Inc')
            ->assertJsonPath('vendor.city', 'New Delhi')
            ->assertJsonPath('vendor.status', 'inactive');

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'vendor_name' => 'Updated Name Inc',
            'city' => 'New Delhi',
            'status' => 'inactive',
        ]);
    }

    /**
     * 27. Vendor code cannot be modified via update.
     */
    public function test_vendor_code_cannot_be_modified_via_update(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-1234',
            'vendor_name' => 'Immutable Code Vendor',
            'email' => 'immutable_' . uniqid() . '@vendor.com',
            'mobile' => '9000001234',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->putJson('/api/superadmin/vendors/' . $vendor->id, [
                'vendor_code' => 'VEN-9999',
                'vendor_name' => 'Immutable Code Vendor Updated',
                'email' => $vendor->email,
                'mobile' => $vendor->mobile,
            ]);

        $response->assertStatus(200);

        // Verify vendor code is still VEN-1234
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'vendor_code' => 'VEN-1234',
        ]);
        $this->assertDatabaseMissing('vendors', [
            'id' => $vendor->id,
            'vendor_code' => 'VEN-9999',
        ]);
    }

    /**
     * 28. Superadmin can update vendor status.
     */
    public function test_superadmin_can_update_vendor_status(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-9041',
            'vendor_name' => 'Status Toggle Vendor',
            'email' => 'toggle_' . uniqid() . '@vendor.com',
            'mobile' => '9000009041',
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->patchJson('/api/superadmin/vendors/' . $vendor->id . '/status', [
                'status' => 'blocked',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('vendor.status', 'blocked');

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'status' => 'blocked',
        ]);
    }

    /**
     * 29. Invalid vendor status is rejected.
     */
    public function test_invalid_vendor_status_is_rejected(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-9051',
            'vendor_name' => 'Invalid Status Vendor',
            'email' => 'invalid_status_' . uniqid() . '@vendor.com',
            'mobile' => '9000009051',
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->patchJson('/api/superadmin/vendors/' . $vendor->id . '/status', [
                'status' => 'unknown_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * 30. Preview code endpoint returns next sequential code.
     */
    public function test_preview_code_endpoint_returns_next_sequential_code(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors/preview-code');

        $response->assertStatus(200)
            ->assertJsonStructure(['preview_code']);

        $code = $response->json('preview_code');
        $this->assertMatchesRegularExpression('/^VEN-\d{4,}$/', $code);
    }

    /**
     * 31. Types endpoint returns available vendor types.
     */
    public function test_types_endpoint_returns_available_vendor_types(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors/types');

        $response->assertStatus(200)
            ->assertJsonStructure(['types']);

        $types = $response->json('types');
        $this->assertIsArray($types);
        $this->assertContains('Supplier', $types);
        $this->assertContains('Manufacturer', $types);
    }

    /**
     * 32. Viewing nonexistent vendor returns 404.
     */
    public function test_viewing_nonexistent_vendor_returns_404(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/superadmin/vendors/9999999');

        $response->assertStatus(404);
    }
}

