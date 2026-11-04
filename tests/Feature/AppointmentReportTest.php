<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\MasterAppointment;
use App\Models\SalesMember;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentReportTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;

    protected SuperAdmin $superAdmin;

    protected Customer $customer;

    protected Staff $staff;

    protected SalesMember $salesMember;

    protected Service $service;

    protected MasterAppointment $masterAppointment;

    protected AppointmentSession $session1;

    protected AppointmentSession $session2;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Admin
        $this->admin = Admin::create([
            'name' => 'Operational Admin',
            'email' => 'admin_rpt_'.uniqid().'@example.com',
            'password' => Hash::make('Password@123'),
            'role' => 'admin',
            'is_active' => true,
            'status' => 'active',
        ]);

        // 2. Create Superadmin
        $this->superAdmin = SuperAdmin::create([
            'name' => 'Lead Superadmin',
            'email' => 'superadmin_rpt_'.uniqid().'@example.com',
            'password' => Hash::make('SuperPass@123'),
            'is_active' => true,
        ]);

        // 3. Create Customer
        $this->customer = Customer::create([
            'name' => 'Kavita Mehra',
            'mobile' => '9876543210',
            'email' => 'kavita@example.com',
            'gender' => 'female',
            'age' => 29,
            'address' => '12 Rose Avenue, Mumbai',
            'is_active' => true,
        ]);

        // 4. Create Staff
        $this->staff = Staff::create([
            'staff_code' => 'STF-0010',
            'name' => 'Dr. Neha Kapoor',
            'email' => 'neha_'.uniqid().'@example.com',
            'mobile' => '9112233445',
            'department' => 'Dermatology',
            'designation' => 'Cosmetologist',
            'status' => 'active',
            'is_active' => true,
        ]);

        // 5. Create Sales Member
        $this->salesMember = SalesMember::create([
            'sales_code' => 'SLS-005',
            'name' => 'Rajesh Sharma',
            'email' => 'rajesh_'.uniqid().'@example.com',
            'mobile' => '9888877777',
            'department' => 'Corporate Healthcare',
            'territory' => 'West Zone',
            'status' => 'active',
            'is_active' => true,
        ]);

        // 6. Create Service Category & Service
        $category = ServiceCategory::create([
            'name' => 'Facial Aesthetics',
            'slug' => 'facial-aesthetics-'.uniqid(),
            'status' => 'active',
        ]);

        $this->service = Service::create([
            'service_category_id' => $category->id,
            'name' => 'Hydra Facial Premium',
            'price' => 3500.00,
            'status' => 'active',
        ]);

        // 7. Create Master Appointment
        $this->masterAppointment = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261104-0001',
            'customer_id' => $this->customer->id,
            'appointment_date' => now()->toDateString(),
            'sales_team_id' => $this->salesMember->id,
            'appointment_fees' => 7000.00,
            'notes' => 'Patient booked for 2 full Hydra sessions.',
            'admin_id' => $this->admin->id,
        ]);

        // 8. Create 2 Appointment Sessions
        $this->session1 = AppointmentSession::create([
            'master_appointment_id' => $this->masterAppointment->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Deep pore cleansing and hydration therapy.',
            'session_date' => now()->toDateString(),
            'session_time' => '10:00 AM',
            'staff_id' => $this->staff->id,
            'staff_commission' => 1000.00,
            'status' => AppointmentSession::STATUS_COMPLETED,
            'payment_amount' => 3500.00,
            'payment_date' => now()->toDateString(),
            'payment_mode' => 'cash',
            'payment_notes' => 'Cash payment collected in full.',
        ]);

        $this->session2 = AppointmentSession::create([
            'master_appointment_id' => $this->masterAppointment->id,
            'session_number' => 2,
            'service_id' => $this->service->id,
            'treatment_details' => 'Follow-up peptide infusion session.',
            'session_date' => now()->addDays(7)->toDateString(),
            'session_time' => '02:00 PM',
            'staff_id' => $this->staff->id,
            'staff_commission' => 1000.00,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);
    }

    /**
     * Unauthenticated guest cannot access reports.
     */
    public function test_guest_cannot_access_reports(): void
    {
        $response = $this->getJson('/api/admin/reports/appointments');
        $response->assertStatus(401);

        $superResponse = $this->getJson('/api/superadmin/reports/appointments');
        $superResponse->assertStatus(401);
    }

    /**
     * Admin can view master appointments report with accurate summary.
     */
    public function test_admin_can_view_appointments_report(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->getJson('/api/admin/reports/appointments');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'report' => [
                    'data',
                    'current_page',
                    'total',
                ],
                'summary' => [
                    'total_appointments',
                    'total_fees',
                    'total_sessions',
                    'completed_sessions',
                    'pending_sessions',
                    'total_patient_paid',
                    'total_staff_commission',
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('summary.total_appointments'));
        $this->assertEquals(7000.00, (float) $response->json('summary.total_fees'));
        $this->assertEquals(3500.00, (float) $response->json('summary.total_patient_paid'));
    }

    /**
     * Admin can view session-wise report with status and payment breakdown.
     */
    public function test_admin_can_view_sessions_report(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->getJson('/api/admin/reports/sessions');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'report' => ['data'],
                'summary' => [
                    'total_sessions',
                    'completed_sessions',
                    'pending_sessions',
                    'total_patient_paid',
                    'total_staff_commission',
                ],
            ]);

        $this->assertGreaterThanOrEqual(2, $response->json('summary.total_sessions'));
        $this->assertGreaterThanOrEqual(1, $response->json('summary.completed_sessions'));
        $this->assertGreaterThanOrEqual(1, $response->json('summary.pending_sessions'));
    }

    /**
     * Superadmin can access appointment and session reports.
     */
    public function test_superadmin_can_view_reports(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $apptResponse = $this->getJson('/api/superadmin/reports/appointments');
        $apptResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $sesResponse = $this->getJson('/api/superadmin/reports/sessions');
        $sesResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Filter options endpoint returns staff, sales team, services, and statuses.
     */
    public function test_filter_options_endpoint_returns_data(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->getJson('/api/admin/reports/appointments/filter-options');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'staff',
                'sales_team',
                'services',
                'customers',
                'statuses',
                'payment_statuses',
            ]);
    }

    /**
     * Filter by status and search returns expected subset.
     */
    public function test_filtering_sessions_by_status(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        // Filter by completed status
        $response = $this->getJson('/api/admin/reports/sessions?status=completed');

        $response->assertStatus(200);
        $data = $response->json('report.data');

        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertEquals('completed', $item['status']);
        }
    }

    /**
     * Staff role cannot access clinic-wide appointment or session reports (403 Forbidden).
     */
    public function test_staff_role_cannot_access_clinic_reports(): void
    {
        $staffUser = Staff::create([
            'staff_code' => 'STF-TEST-99',
            'name' => 'Staff Doctor',
            'email' => 'staff_doc_'.uniqid().'@example.com',
            'mobile' => '9111122222',
            'status' => 'active',
            'is_active' => true,
        ]);

        Sanctum::actingAs($staffUser, ['role:staff']);

        $response = $this->getJson('/api/admin/reports/appointments');
        $response->assertStatus(403);

        $sesResponse = $this->getJson('/api/admin/reports/sessions');
        $sesResponse->assertStatus(403);
    }
}
