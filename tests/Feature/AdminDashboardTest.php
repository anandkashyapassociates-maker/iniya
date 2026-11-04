<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use App\Models\MasterAppointment;
use App\Models\SalesMember;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;

    protected Customer $customer;

    protected Staff $staff;

    protected Service $service;

    protected MasterAppointment $masterAppointment;

    protected AppointmentSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'name' => 'Executive Director',
            'email' => 'admin_dash_'.uniqid().'@example.com',
            'password' => Hash::make('AdminPass@2026!'),
            'role' => 'admin',
            'is_active' => true,
            'status' => 'active',
        ]);

        $this->customer = Customer::create([
            'name' => 'Meera Kapoor',
            'mobile' => '9822334455',
            'email' => 'meera@example.com',
            'gender' => 'female',
            'age' => 31,
            'address' => '45 Marine Drive, Mumbai',
            'is_active' => true,
        ]);

        $this->staff = Staff::create([
            'staff_code' => 'STF-DOC-01',
            'name' => 'Dr. Ananya Roy',
            'email' => 'ananya_'.uniqid().'@example.com',
            'mobile' => '9988112233',
            'department' => 'Dermatology',
            'designation' => 'Lead Dermatologist',
            'status' => 'active',
            'is_active' => true,
        ]);

        $category = ServiceCategory::create([
            'name' => 'Laser Treatments',
            'slug' => 'laser-treatments-'.uniqid(),
            'status' => 'active',
        ]);

        $this->service = Service::create([
            'service_category_id' => $category->id,
            'name' => 'Laser Skin Rejuvenation',
            'price' => 5000.00,
            'status' => 'active',
        ]);

        $sales = SalesMember::create([
            'sales_code' => 'SLS-DASH-01',
            'name' => 'Vikas Malhotra',
            'email' => 'vikas_'.uniqid().'@example.com',
            'mobile' => '9888112233',
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->masterAppointment = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261104-9001',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $sales->id,
            'appointment_date' => now()->toDateString(),
            'appointment_fees' => 5000.00,
            'notes' => 'Priority OPD Laser session.',
            'admin_id' => $this->admin->id,
        ]);

        $this->session = AppointmentSession::create([
            'master_appointment_id' => $this->masterAppointment->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Full face laser toning.',
            'session_date' => now()->toDateString(),
            'session_time' => '11:30 AM',
            'staff_id' => $this->staff->id,
            'staff_commission' => 1200.00,
            'status' => AppointmentSession::STATUS_COMPLETED,
            'payment_amount' => 5000.00,
            'payment_date' => now()->toDateString(),
            'payment_mode' => 'upi',
            'payment_notes' => 'Received via Google Pay QR.',
        ]);

        $invCat = InventoryCategory::create([
            'name' => 'Serums & Topicals',
            'slug' => 'serums-topicals-'.uniqid(),
            'status' => 'active',
        ]);

        $invBrand = InventoryBrand::create([
            'name' => 'Dermacare Elite',
            'slug' => 'dermacare-elite-'.uniqid(),
            'status' => 'active',
        ]);

        InventoryProduct::create([
            'category_id' => $invCat->id,
            'brand_id' => $invBrand->id,
            'product_name' => 'Hydrating Hyaluronic Serum',
            'business_unit' => 'Bottle',
            'product_unit' => 1,
            'product_type' => 'Consumable',
            'quantity' => 2,
            'low_stock_threshold' => 5,
            'status' => 'active',
            'created_by_admin_id' => $this->admin->id,
        ]);
    }

    /**
     * Unauthenticated guest cannot access dashboard.
     */
    public function test_guest_cannot_access_dashboard_api(): void
    {
        $response = $this->getJson('/api/admin/dashboard');
        $response->assertStatus(401);
    }

    /**
     * Authenticated Admin can fetch full operational dashboard analytics.
     */
    public function test_admin_can_fetch_full_dashboard(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'stats' => [
                    'total_customers',
                    'new_customers_this_month',
                    'total_appointments',
                    'today_appointments',
                    'total_sessions',
                    'today_sessions',
                    'session_completion_rate',
                    'today_revenue',
                    'total_revenue',
                    'today_patient_paid',
                    'total_patient_paid',
                    'today_staff_commission',
                    'total_staff_commission',
                    'active_packages',
                    'active_staff_count',
                    'low_stock_count',
                ],
                'account' => [
                    'name',
                    'email',
                    'role',
                    'status',
                ],
                'payment_modes' => [
                    'cash',
                    'upi',
                    'card',
                    'bank',
                ],
                'revenue_chart' => [
                    'Last 6 Months',
                    'Last 30 Days',
                    'This Year',
                ],
                'doctors_on_duty',
                'top_services',
                'low_stock_products',
                'recent_patients',
                'schedule_sessions',
            ]);

        // Assert accurate values
        $this->assertEquals(1, $response->json('stats.total_customers'));
        $this->assertEquals(5000.00, (float) $response->json('stats.total_revenue'));
        $this->assertEquals(5000.00, (float) $response->json('stats.total_patient_paid'));
        $this->assertEquals(5000.00, (float) $response->json('payment_modes.upi'));
        $this->assertNotEmpty($response->json('schedule_sessions'));
        $this->assertNotEmpty($response->json('low_stock_products'));
    }

    /**
     * Authenticated Staff can access dashboard summary tailored to their profile.
     */
    public function test_staff_can_access_dashboard(): void
    {
        Sanctum::actingAs($this->staff, ['role:staff']);

        $response = $this->getJson('/api/admin/dashboard');
        $response->assertStatus(200);
        $this->assertEquals('Staff Practitioner', $response->json('account.role'));
        $this->assertTrue($response->json('account.is_staff'));
        // Staff cannot view patient registrations
        $this->assertEmpty($response->json('recent_patients'));
        // Staff cannot view other doctors on duty list
        $this->assertEmpty($response->json('doctors_on_duty'));
    }

    /**
     * Staff dashboard is strictly isolated to the logged-in staff's personal data.
     */
    public function test_staff_dashboard_strictly_isolated_to_own_data_and_never_leaks_other_staff(): void
    {
        // Create another staff member with their own session
        $otherStaff = Staff::create([
            'staff_code' => 'STF-DOC-99',
            'name' => 'Dr. Rohit Verma',
            'email' => 'rohit_'.uniqid().'@example.com',
            'mobile' => '9988998899',
            'department' => 'Cosmetology',
            'designation' => 'Cosmetologist',
            'status' => 'active',
            'is_active' => true,
        ]);

        $otherSession = AppointmentSession::create([
            'master_appointment_id' => $this->masterAppointment->id,
            'session_number' => 2,
            'service_id' => $this->service->id,
            'treatment_details' => 'Chemical Peel.',
            'session_date' => now()->toDateString(),
            'session_time' => '02:00 PM',
            'staff_id' => $otherStaff->id,
            'staff_commission' => 2500.00,
            'status' => AppointmentSession::STATUS_COMPLETED,
            'payment_amount' => 7000.00,
            'payment_date' => now()->toDateString(),
            'payment_mode' => 'cash',
        ]);

        // Login as first staff ($this->staff)
        Sanctum::actingAs($this->staff, ['role:staff']);

        $response = $this->getJson('/api/admin/dashboard');
        $response->assertStatus(200);

        // 1. Must only count their own sessions (1 session), NOT otherStaff's session
        $this->assertEquals(1, $response->json('stats.total_sessions'));
        $this->assertEquals(1, $response->json('stats.today_sessions'));

        // 2. Must only show their own commission (1200), NOT otherStaff's 2500
        $this->assertEquals(1200.00, (float) $response->json('stats.total_staff_commission'));
        $this->assertEquals(1200.00, (float) $response->json('stats.today_staff_commission'));

        // 3. Payment collections must only include their own session payments (5000 UPI, 0 Cash)
        $this->assertEquals(5000.00, (float) $response->json('stats.total_patient_paid'));
        $this->assertEquals(5000.00, (float) $response->json('payment_modes.upi'));
        $this->assertEquals(0.00, (float) $response->json('payment_modes.cash'));

        // 4. Schedule feed must strictly only contain this staff's sessions
        $schedule = collect($response->json('schedule_sessions'));
        $this->assertCount(1, $schedule);
        $this->assertEquals($this->session->id, $schedule->first()['id']);

        // 5. Doctors on duty and recent patients must be empty collections
        $this->assertEmpty($response->json('doctors_on_duty'));
        $this->assertEmpty($response->json('recent_patients'));
    }
}
