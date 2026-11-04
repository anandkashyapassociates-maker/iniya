<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOnlyAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected Staff $staff;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'name' => 'Clinic Admin',
            'email' => 'admin_'.uniqid().'@example.com',
            'password' => Hash::make('AdminPass123!'),
            'role' => 'admin',
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->staff = Staff::create([
            'staff_code' => 'STF-GUARD-01',
            'name' => 'Dr. Shweta Singh',
            'email' => 'shweta_'.uniqid().'@example.com',
            'password' => Hash::make('StaffPass123!'),
            'mobile' => '9877112233',
            'department' => 'Dermatology',
            'status' => 'active',
            'is_active' => true,
        ]);
    }

    /**
     * Staff cannot access or modify any admin-only modules via API.
     */
    public function test_staff_is_strictly_forbidden_from_admin_modules(): void
    {
        Sanctum::actingAs($this->staff, ['role:staff']);

        // 1. Customer / Patient Directory
        $this->getJson('/api/admin/customers')->assertStatus(403);
        $this->postJson('/api/admin/customers', ['name' => 'Blocked'])->assertStatus(403);

        // 2. Master Appointments & Sessions
        $this->getJson('/api/admin/master-appointments')->assertStatus(403);
        $this->postJson('/api/admin/master-appointments', [])->assertStatus(403);
        $this->getJson('/api/admin/calendar/sessions')->assertStatus(403);

        // 3. Inventory Supplies & Stocks
        $this->getJson('/api/admin/inventory/stocks')->assertStatus(403);
        $this->postJson('/api/admin/inventory/stocks/1/add', [])->assertStatus(403);
        $this->getJson('/api/admin/inventory/products')->assertStatus(403);

        // 4. Clinical Services Management
        $this->getJson('/api/admin/services-management/categories')->assertStatus(403);
        $this->postJson('/api/admin/services-management/services', [])->assertStatus(403);

        // 5. Financial & Audit Reports
        $this->getJson('/api/admin/reports/appointments')->assertStatus(403);
        $this->getJson('/api/admin/reports/sessions')->assertStatus(403);
        $this->getJson('/api/admin/reports/payouts')->assertStatus(403);
    }

    /**
     * Staff is allowed to access their own designated portal routes.
     */
    public function test_staff_can_access_their_own_sidebar_modules(): void
    {
        Sanctum::actingAs($this->staff, ['role:staff']);

        // Clinic Dashboard
        $this->getJson('/api/admin/dashboard')->assertStatus(200);

        // Profile
        $this->getJson('/api/admin/me')->assertStatus(200);

        // My Appointments
        $this->getJson('/api/admin/my-appointments')->assertStatus(200);
    }

    /**
     * Admin can access all administrative modules without restriction.
     */
    public function test_admin_can_access_all_admin_modules(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $this->getJson('/api/admin/dashboard')->assertStatus(200);
        $this->getJson('/api/admin/customers')->assertStatus(200);
        $this->getJson('/api/admin/master-appointments')->assertStatus(200);
        $this->getJson('/api/admin/inventory/stocks')->assertStatus(200);
        $this->getJson('/api/admin/services-management/categories')->assertStatus(200);
    }
}
