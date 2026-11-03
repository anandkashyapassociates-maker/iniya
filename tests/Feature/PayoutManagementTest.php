<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use App\Models\InventoryStockLog;
use App\Models\Payout;
use App\Models\Staff;
use App\Models\SuperAdmin;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PayoutManagementTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;

    protected string $superAdminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Lead Superadmin',
            'email' => 'superadmin_payout_test_'.uniqid().'@example.com',
            'password' => Hash::make('SuperSecurePass@2026!'),
            'is_active' => true,
        ]);

        $this->superAdminToken = $this->superAdmin->createToken('superadmin-test-token', ['role:superadmin'])->plainTextToken;
    }

    /**
     * Test Superadmin can fetch active staff and vendor options.
     */
    public function test_superadmin_can_fetch_staff_and_vendor_options(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-001',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'mobile' => '9988776655',
            'department' => 'Administration',
            'designation' => 'Clerk',
            'employment_type' => 'Full-Time',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $vendor = Vendor::create([
            'vendor_code' => 'VEN-001',
            'vendor_name' => 'Acme Medicals',
            'company_name' => 'Acme Corp',
            'email' => 'acme@example.com',
            'mobile' => '9988776644',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $staffRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/staff-options');

        $staffRes->assertStatus(200)
            ->assertJsonFragment(['name' => 'John Doe']);

        $vendorRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/vendor-options');

        $vendorRes->assertStatus(200)
            ->assertJsonFragment(['vendor_name' => 'Acme Medicals']);
    }

    /**
     * Test Superadmin can record and list Staff Payout.
     */
    public function test_superadmin_can_record_and_list_staff_payout(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-002',
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'mobile' => '9988776633',
            'department' => 'Accounts',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payload = [
            'staff_id' => $staff->id,
            'amount' => 15000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Bank',
            'reference_number' => 'UTR-10928374',
            'note' => 'Monthly salary disbursement for November 2026',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/staff', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('message', 'Staff payout recorded successfully.')
            ->assertJsonPath('payout.account_type', 'Bank');

        $this->assertDatabaseHas('payouts', [
            'staff_id' => $staff->id,
            'payout_type' => Payout::TYPE_STAFF,
            'amount' => 15000.00,
            'account_type' => 'Bank',
        ]);

        // List staff payouts
        $listRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/staff?search=Jane');

        $listRes->assertStatus(200)
            ->assertJsonPath('summary.total_amount', 15000)
            ->assertJsonPath('summary.bank_amount', 15000);
    }

    /**
     * Test Superadmin can record and list Vendor Payout.
     */
    public function test_superadmin_can_record_and_list_vendor_payout(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-002',
            'vendor_name' => 'Dental Care Supplies',
            'company_name' => 'Dental Care Ltd',
            'email' => 'dentalcare@example.com',
            'mobile' => '9988776622',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payload = [
            'vendor_id' => $vendor->id,
            'amount' => 25000.50,
            'payout_date' => '2026-11-03',
            'account_type' => 'Cash',
            'reference_number' => 'CASH-REC-001',
            'note' => 'Material invoice payment',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/vendors', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('message', 'Vendor payout recorded successfully.')
            ->assertJsonPath('payout.account_type', 'Cash');

        $this->assertDatabaseHas('payouts', [
            'vendor_id' => $vendor->id,
            'payout_type' => Payout::TYPE_VENDOR,
            'amount' => 25000.50,
            'account_type' => 'Cash',
        ]);

        // List vendor payouts
        $listRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/vendors?account_type=Cash');

        $listRes->assertStatus(200)
            ->assertJsonPath('summary.total_amount', 25000.5)
            ->assertJsonPath('summary.cash_amount', 25000.5);
    }

    /**
     * Test Unified Payouts Ledger with date, staff, vendor, and account type filters.
     */
    public function test_superadmin_unified_payouts_ledger(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-003',
            'name' => 'Robert Paul',
            'email' => 'robert@example.com',
            'mobile' => '9988776611',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $vendor = Vendor::create([
            'vendor_code' => 'VEN-003',
            'vendor_name' => 'Pharma Plus',
            'email' => 'pharmaplus@example.com',
            'mobile' => '9988776600',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        // Record Staff Payout
        Payout::create([
            'payout_number' => 'PAY-STF-TEST1',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'amount' => 10000.00,
            'payout_date' => '2026-11-01',
            'account_type' => 'Bank',
            'status' => Payout::STATUS_COMPLETED,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        // Record Vendor Payout
        Payout::create([
            'payout_number' => 'PAY-VEN-TEST1',
            'payout_type' => Payout::TYPE_VENDOR,
            'vendor_id' => $vendor->id,
            'amount' => 20000.00,
            'payout_date' => '2026-11-02',
            'account_type' => 'Cash',
            'status' => Payout::STATUS_COMPLETED,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        // 1. Fetch entire ledger
        $ledgerRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/ledger');

        $ledgerRes->assertStatus(200)
            ->assertJsonPath('summary.total_disbursed', 30000)
            ->assertJsonPath('summary.total_staff_disbursed', 10000)
            ->assertJsonPath('summary.total_vendor_disbursed', 20000)
            ->assertJsonPath('summary.total_cash_disbursed', 20000)
            ->assertJsonPath('summary.total_bank_disbursed', 10000);

        // 2. Filter by staff only
        $staffLedgerRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/ledger?payout_type=staff');

        $staffLedgerRes->assertStatus(200)
            ->assertJsonPath('summary.records_count', 1)
            ->assertJsonPath('summary.total_disbursed', 10000);

        // 3. Filter by vendor only
        $vendorLedgerRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/ledger?payout_type=vendor');

        $vendorLedgerRes->assertStatus(200)
            ->assertJsonPath('summary.records_count', 1)
            ->assertJsonPath('summary.total_disbursed', 20000);
    }

    /**
     * Test single payout show and verify deleting is forbidden (cannot be deleted, only edited).
     */
    public function test_superadmin_can_show_payout_and_delete_is_forbidden(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-004',
            'name' => 'Emily Watson',
            'email' => 'emily@example.com',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payout = Payout::create([
            'payout_number' => 'PAY-STF-TEST2',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'amount' => 5000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Cash',
            'status' => Payout::STATUS_COMPLETED,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        // Show
        $showRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson("/api/superadmin/payouts/{$payout->id}");

        $showRes->assertStatus(200)
            ->assertJsonPath('payout.payout_number', 'PAY-STF-TEST2');

        // Delete should return 403 Forbidden as payouts cannot be deleted
        $delRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->deleteJson("/api/superadmin/payouts/{$payout->id}");

        $delRes->assertStatus(403)
            ->assertJsonFragment(['message' => 'Payout records cannot be deleted. They can only be edited.']);

        $this->assertDatabaseHas('payouts', ['id' => $payout->id]);
    }

    /**
     * Test Superadmin can edit/update Staff Payout.
     */
    public function test_superadmin_can_update_staff_payout(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-EDIT-01',
            'name' => 'Dr. Robert',
            'email' => 'robert@example.com',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payout = Payout::create([
            'payout_number' => 'PAY-STF-EDIT1',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'total_amount' => 8000.00,
            'paid_amount' => 3000.00,
            'balance_amount' => 5000.00,
            'amount' => 3000.00,
            'payout_date' => '2026-11-01',
            'account_type' => 'Bank',
            'status' => Payout::STATUS_PARTIAL,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $updatePayload = [
            'staff_id' => $staff->id,
            'amount' => 5000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Cash',
            'reference_number' => 'UPDATED-REF-99',
            'note' => 'Updated disbursement amount',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->putJson("/api/superadmin/payouts/staff/{$payout->id}", $updatePayload);

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Staff payout updated successfully.')
            ->assertJsonPath('payout.amount', '5000.00')
            ->assertJsonPath('payout.account_type', 'Cash')
            ->assertJsonPath('payout.reference_number', 'UPDATED-REF-99');

        $this->assertDatabaseHas('payouts', [
            'id' => $payout->id,
            'amount' => 5000.00,
            'account_type' => 'Cash',
            'reference_number' => 'UPDATED-REF-99',
        ]);
    }

    /**
     * Test Superadmin can edit/update Vendor Payout.
     */
    public function test_superadmin_can_update_vendor_payout(): void
    {
        $vendor = Vendor::create([
            'vendor_code' => 'VEN-EDIT-01',
            'vendor_name' => 'Sunrise Pharma',
            'company_name' => 'Sunrise Ltd',
            'email' => 'sunrise@example.com',
            'mobile' => '9123456789',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payout = Payout::create([
            'payout_number' => 'PAY-VEN-EDIT1',
            'payout_type' => Payout::TYPE_VENDOR,
            'vendor_id' => $vendor->id,
            'total_amount' => 10000.00,
            'paid_amount' => 4000.00,
            'balance_amount' => 6000.00,
            'amount' => 4000.00,
            'payout_date' => '2026-11-01',
            'account_type' => 'Cash',
            'status' => Payout::STATUS_PARTIAL,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $updatePayload = [
            'vendor_id' => $vendor->id,
            'amount' => 10000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Bank',
            'reference_number' => 'BANK-UTR-999',
            'note' => 'Fully settled invoice',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->putJson("/api/superadmin/payouts/vendors/{$payout->id}", $updatePayload);

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Vendor payout updated successfully.')
            ->assertJsonPath('payout.amount', '10000.00')
            ->assertJsonPath('payout.balance_amount', '0.00')
            ->assertJsonPath('payout.status', 'completed');

        $this->assertDatabaseHas('payouts', [
            'id' => $payout->id,
            'amount' => 10000.00,
            'balance_amount' => 0.00,
            'status' => Payout::STATUS_COMPLETED,
        ]);
    }

    /**
     * Test unauthorized request is denied.
     */
    public function test_unauthorized_user_cannot_access_payouts(): void
    {
        $res = $this->getJson('/api/superadmin/payouts/ledger');
        $res->assertStatus(401);
    }

    /**
     * Test Staff Payout pulls total payout from appointment_sessions commissions.
     */
    public function test_staff_payout_pulls_total_from_appointment_sessions_commissions(): void
    {
        $staff = Staff::create([
            'staff_code' => 'STF-COMM-01',
            'name' => 'Doctor Kumar',
            'email' => 'drkumar@example.com',
            'mobile' => '9876543210',
            'department' => 'Dentistry',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $customerId = DB::table('customers')->insertGetId([
            'name' => 'John Patient',
            'mobile' => '9811122233',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $salesMemberId = DB::table('sales_members')->insertGetId([
            'sales_code' => 'SALES-01',
            'name' => 'Sales Agent',
            'email' => 'sales@example.com',
            'mobile' => '9811122244',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $masterAppointmentId = DB::table('master_appointments')->insertGetId([
            'appointment_number' => 'APT-2026-0001',
            'customer_id' => $customerId,
            'appointment_date' => '2026-11-03',
            'sales_team_id' => $salesMemberId,
            'appointment_fees' => 3000.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert appointment sessions with commissions for this staff member (1200 + 800 = 2000 total commission)
        DB::table('appointment_sessions')->insert([
            [
                'master_appointment_id' => $masterAppointmentId,
                'session_number' => 1,
                'treatment_details' => 'Root Canal Session 1',
                'session_date' => '2026-11-03',
                'session_time' => '10:00 AM',
                'staff_id' => $staff->id,
                'staff_commission' => 1200.00,
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'master_appointment_id' => $masterAppointmentId,
                'session_number' => 2,
                'treatment_details' => 'Root Canal Session 2',
                'session_date' => '2026-11-03',
                'session_time' => '02:00 PM',
                'staff_id' => $staff->id,
                'staff_commission' => 800.00,
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 1. Verify staff options returns total commission of 2000 and pending balance of 2000
        $staffOptionsRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/staff-options');

        $staffOptionsRes->assertStatus(200);
        $staffData = collect($staffOptionsRes->json())->firstWhere('id', $staff->id);
        $this->assertNotNull($staffData);
        $this->assertEquals(2000.00, (float) $staffData['total_commission']);
        $this->assertEquals(0.00, (float) $staffData['total_paid']);
        $this->assertEquals(2000.00, (float) $staffData['pending_balance']);

        // 2. Disburse partial payout of 750
        $partialPayload = [
            'staff_id' => $staff->id,
            'amount' => 750.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Bank',
            'note' => 'First partial payout against commission',
        ];

        $payout1Res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/staff', $partialPayload);

        $payout1Res->assertStatus(201)
            ->assertJsonPath('payout.total_amount', '2000.00')
            ->assertJsonPath('payout.paid_amount', '750.00')
            ->assertJsonPath('payout.balance_amount', '1250.00')
            ->assertJsonPath('payout.status', 'partial');

        // 3. Disburse remaining payout of 1250
        $remainingPayload = [
            'staff_id' => $staff->id,
            'amount' => 1250.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Cash',
            'note' => 'Settlement of remaining commission balance',
        ];

        $payout2Res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/staff', $remainingPayload);

        $payout2Res->assertStatus(201)
            ->assertJsonPath('payout.total_amount', '2000.00')
            ->assertJsonPath('payout.paid_amount', '1250.00')
            ->assertJsonPath('payout.balance_amount', '0.00')
            ->assertJsonPath('payout.status', 'completed');

        // 4. Verify staff options now shows pending balance 0
        $staffOptionsRes2 = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/staff-options');

        $staffData2 = collect($staffOptionsRes2->json())->firstWhere('id', $staff->id);
        $this->assertEquals(2000.00, (float) $staffData2['total_commission']);
        $this->assertEquals(2000.00, (float) $staffData2['total_paid']);
        $this->assertEquals(0.00, (float) $staffData2['pending_balance']);
    }

    /**
     * Test vendor payout derives total payable from inventory_stock_logs with type = purchase.
     */
    public function test_vendor_payout_derives_total_payable_from_inventory_stock_logs_purchase_type(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Store Admin',
            'email' => 'storeadmin_test_'.uniqid().'@example.com',
            'mobile' => '9888877777',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $category = InventoryCategory::create([
            'name' => 'General Consumables',
            'slug' => 'general-consumables-'.uniqid(),
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $brand = InventoryBrand::create([
            'name' => 'Standard Care',
            'slug' => 'standard-care-'.uniqid(),
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $vendor = Vendor::create([
            'vendor_code' => 'VEN-LOGS-01',
            'vendor_name' => 'Sunrise Medical Supplies',
            'company_name' => 'Sunrise Healthcare',
            'email' => 'sunrise_'.uniqid().'@example.com',
            'mobile' => '9888877766',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $product1 = InventoryProduct::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'product_name' => 'Surgical Gloves Box',
            'business_unit' => 'Box',
            'product_unit' => 100,
            'product_type' => 'Consumable',
            'buy_price' => 50.00,
            'mrp' => 120.00,
            'quantity' => 100,
            'low_stock_threshold' => 10,
            'status' => 'active',
            'created_by_admin_id' => $admin->id,
        ]);

        $product2 = InventoryProduct::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'product_name' => 'Surgical Mask 100pk',
            'business_unit' => 'Box',
            'product_unit' => 100,
            'product_type' => 'Consumable',
            'buy_price' => 150.00,
            'mrp' => 300.00,
            'quantity' => 20,
            'low_stock_threshold' => 5,
            'status' => 'active',
            'created_by_admin_id' => $admin->id,
        ]);

        // Insert inventory stock logs:
        // Purchase 1: 100 units * 50.00 = 5000.00
        InventoryStockLog::create([
            'product_id' => $product1->id,
            'vendor_id' => $vendor->id,
            'admin_id' => $admin->id,
            'quantity' => 100,
            'business_unit' => 'Box',
            'buy_price' => 50.00,
            'mrp' => 120.00,
            'average_price' => 50.00,
            'type' => 'purchase',
            'notes' => 'Batch 1 stock addition',
        ]);

        // Purchase 2: 20 units * 150.00 = 3000.00
        InventoryStockLog::create([
            'product_id' => $product2->id,
            'vendor_id' => $vendor->id,
            'admin_id' => $admin->id,
            'quantity' => 20,
            'business_unit' => 'Box',
            'buy_price' => 150.00,
            'mrp' => 300.00,
            'average_price' => 150.00,
            'type' => 'purchase',
            'notes' => 'Batch 2 stock addition',
        ]);

        // Issue stock (deduct): must be excluded from purchase total
        InventoryStockLog::create([
            'product_id' => $product1->id,
            'vendor_id' => $vendor->id,
            'admin_id' => $admin->id,
            'quantity' => -10,
            'business_unit' => 'Box',
            'buy_price' => 50.00,
            'mrp' => 120.00,
            'average_price' => 50.00,
            'type' => 'issue',
            'notes' => 'Deducted for clinic usage',
        ]);

        // 1. Verify vendor options has total_purchased_qty = 120, total_purchased_amount = 8000, avg_rate = 66.67
        $vendorOptionsRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/vendor-options');

        $vendorOptionsRes->assertStatus(200);
        $vendorData = collect($vendorOptionsRes->json())->firstWhere('id', $vendor->id);
        $this->assertNotNull($vendorData);
        $this->assertEquals(120, (int) $vendorData['total_purchased_qty']);
        $this->assertEquals(8000.00, (float) $vendorData['total_purchased_amount']);
        $this->assertEquals(66.67, (float) $vendorData['avg_rate']);
        $this->assertEquals(8000.00, (float) $vendorData['pending_balance']);

        // 2. Disburse partial payout of 3000
        $partialPayload = [
            'vendor_id' => $vendor->id,
            'amount' => 3000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Bank',
            'reference_number' => 'NEFT-VEN-001',
            'note' => 'Partial payment against purchases',
        ];

        $payout1Res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/vendors', $partialPayload);

        $payout1Res->assertStatus(201)
            ->assertJsonPath('payout.total_amount', '8000.00')
            ->assertJsonPath('payout.paid_amount', '3000.00')
            ->assertJsonPath('payout.balance_amount', '5000.00')
            ->assertJsonPath('payout.status', 'partial');

        // 3. Check vendor payouts list
        $vendorPayoutsRes = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/vendors?vendor_id='.$vendor->id);

        $vendorPayoutsRes->assertStatus(200)
            ->assertJsonPath('summary.total_purchased_qty', 120)
            ->assertJsonPath('summary.total_payout_amount', 8000)
            ->assertJsonPath('summary.total_paid_amount', 3000)
            ->assertJsonPath('summary.total_balance_amount', 5000);

        $payoutItem = $vendorPayoutsRes->json('payouts.data.0');
        $this->assertEquals(120, (int) $payoutItem['total_purchased_qty']);
        $this->assertEquals(66.67, (float) $payoutItem['avg_buy_price']);
        $this->assertEquals(8000.00, (float) $payoutItem['total_amount']);
        $this->assertEquals(3000.00, (float) $payoutItem['paid_amount']);
        $this->assertEquals(5000.00, (float) $payoutItem['balance_amount']);

        // 4. Disburse remaining 5000
        $remainingPayload = [
            'vendor_id' => $vendor->id,
            'amount' => 5000.00,
            'payout_date' => '2026-11-03',
            'account_type' => 'Cash',
            'reference_number' => 'CASH-SETTLE-02',
            'note' => 'Remaining settlement',
        ];

        $payout2Res = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson('/api/superadmin/payouts/vendors', $remainingPayload);

        $payout2Res->assertStatus(201)
            ->assertJsonPath('payout.total_amount', '8000.00')
            ->assertJsonPath('payout.paid_amount', '5000.00')
            ->assertJsonPath('payout.balance_amount', '0.00')
            ->assertJsonPath('payout.status', 'completed');

        // 5. Verify vendor options now reflects pending balance 0
        $vendorOptionsRes2 = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/payouts/vendor-options');

        $vendorData2 = collect($vendorOptionsRes2->json())->firstWhere('id', $vendor->id);
        $this->assertEquals(8000.00, (float) $vendorData2['total_purchased_amount']);
        $this->assertEquals(8000.00, (float) $vendorData2['total_paid']);
        $this->assertEquals(0.00, (float) $vendorData2['pending_balance']);
    }

    /**
     * Test admin can access payouts reports ledger, dropdown options, and voucher details.
     */
    public function test_admin_can_access_payouts_reports_ledger_and_options(): void
    {
        $admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Clinic Admin Reporter',
            'email' => 'admin_reporter_'.uniqid().'@example.com',
            'mobile' => '9777788888',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);

        $adminToken = $admin->createToken('admin-reporter-token', ['role:admin'])->plainTextToken;

        $staff = Staff::create([
            'staff_code' => 'STF-REP-01',
            'name' => 'Report Staff Member',
            'email' => 'repstaff_'.uniqid().'@example.com',
            'mobile' => '9777766666',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $vendor = Vendor::create([
            'vendor_code' => 'VEN-REP-01',
            'vendor_name' => 'Report Vendor Supplies',
            'email' => 'repvendor_'.uniqid().'@example.com',
            'mobile' => '9777755555',
            'status' => 'active',
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $payout = Payout::create([
            'payout_number' => 'PAY-REP-001',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'total_amount' => 5000.00,
            'paid_amount' => 5000.00,
            'balance_amount' => 0.00,
            'amount' => 5000.00,
            'payout_date' => '2026-11-03',
            'account_type' => Payout::ACCOUNT_BANK,
            'status' => Payout::STATUS_COMPLETED,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        // 1. Admin accesses Payouts Reports Ledger
        $ledgerRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/reports/payouts');

        $ledgerRes->assertStatus(200)
            ->assertJsonPath('summary.records_count', 1)
            ->assertJsonPath('summary.total_disbursed', 5000)
            ->assertJsonPath('summary.total_staff_disbursed', 5000);

        // 2. Admin accesses staff-options
        $staffOptRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/reports/payouts/staff-options');

        $staffOptRes->assertStatus(200)
            ->assertJsonFragment(['name' => 'Report Staff Member']);

        // 3. Admin accesses vendor-options
        $vendorOptRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/reports/payouts/vendor-options');

        $vendorOptRes->assertStatus(200)
            ->assertJsonFragment(['vendor_name' => 'Report Vendor Supplies']);

        // 4. Admin accesses single voucher details
        $voucherRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/admin/reports/payouts/'.$payout->id);

        $voucherRes->assertStatus(200)
            ->assertJsonPath('payout.payout_number', 'PAY-REP-001')
            ->assertJsonPath('payout.amount', '5000.00');
    }
}
