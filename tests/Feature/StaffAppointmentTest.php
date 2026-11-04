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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StaffAppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;

    protected Admin $admin;

    protected Staff $staff1;

    protected Staff $staff2;

    protected string $adminToken;

    protected string $staff1Token;

    protected string $staff2Token;

    protected Customer $customer;

    protected SalesMember $salesMember;

    protected Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Hospital Governance',
            'email' => 'governance_'.uniqid().'@example.com',
            'password' => Hash::make('Password@123'),
            'is_active' => true,
        ]);

        $this->admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Clinic Reception Admin',
            'email' => 'reception_'.uniqid().'@example.com',
            'mobile' => '9111122222',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);
        $this->adminToken = $this->admin->createToken('admin-token', ['role:admin'])->plainTextToken;

        $this->staff1 = Staff::create([
            'staff_code' => 'STF-DOC-01',
            'name' => 'Dr. Ayesha Khan',
            'email' => 'ayesha_'.uniqid().'@example.com',
            'mobile' => '9888811111',
            'department' => 'Dermatology',
            'designation' => 'Senior Consultant',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);
        $this->staff1Token = $this->staff1->createToken('staff-token', ['role:staff'])->plainTextToken;

        $this->staff2 = Staff::create([
            'staff_code' => 'STF-DOC-02',
            'name' => 'Dr. Vikram Seth',
            'email' => 'vikram_'.uniqid().'@example.com',
            'mobile' => '9888822222',
            'department' => 'Orthopedics',
            'designation' => 'Consultant',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);
        $this->staff2Token = $this->staff2->createToken('staff-token', ['role:staff'])->plainTextToken;

        $this->customer = Customer::create([
            'name' => 'Sunil Verma',
            'email' => 'sunil_'.uniqid().'@example.com',
            'mobile' => '9777712345',
            'gender' => 'male',
            'age' => 38,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $this->salesMember = SalesMember::create([
            'sales_code' => 'SAL-0099',
            'name' => 'Sales Officer Rohit',
            'email' => 'rohit_'.uniqid().'@example.com',
            'mobile' => '9888899999',
            'status' => 'active',
        ]);

        $category = ServiceCategory::create([
            'name' => 'Skin Therapy',
            'status' => 'active',
        ]);

        $this->service = Service::create([
            'service_category_id' => $category->id,
            'name' => 'Laser Treatment',
            'price' => 2500.00,
            'status' => 'active',
        ]);
    }

    /**
     * Test staff can view only their assigned appointment sessions with date and customer details.
     */
    public function test_staff_can_view_assigned_appointments_list(): void
    {
        // 1. Master Appointment 1 with Session assigned to Staff 1
        $today = now()->toDateString();

        $mapt1 = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0001',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => $today,
            'appointment_fees' => 2500.00,
            'notes' => 'Patient requires consultation for skin allergy',
            'image' => 'appointments/mapt1_presc.jpg',
            'admin_id' => $this->admin->id,
        ]);

        AppointmentSession::create([
            'master_appointment_id' => $mapt1->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Initial laser consultation',
            'session_date' => $today,
            'session_time' => '10:00 AM',
            'staff_id' => $this->staff1->id,
            'staff_commission' => 500.00,
            'status' => AppointmentSession::STATUS_PENDING,
            'image' => 'sessions/session1_photo.jpg',
        ]);

        // 2. Master Appointment 2 with Session assigned to Staff 2
        $mapt2 = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0002',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => '2026-11-03',
            'appointment_fees' => 1500.00,
            'notes' => 'Orthopedic knee pain checkup',
            'admin_id' => $this->admin->id,
        ]);

        AppointmentSession::create([
            'master_appointment_id' => $mapt2->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Knee joint checkup',
            'session_date' => '2026-11-03',
            'session_time' => '11:30 AM',
            'staff_id' => $this->staff2->id,
            'staff_commission' => 300.00,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        // Call as Staff 1
        $res = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->getJson('/api/admin/my-appointments');

        $res->assertStatus(200)
            ->assertJsonPath('summary.total_sessions', 1)
            ->assertJsonPath('summary.pending_sessions', 1)
            ->assertJsonPath('summary.today_sessions', 1)
            ->assertJsonPath('summary.total_commission_earned', 500)
            ->assertJsonPath('sessions.data.0.session_number', 1)
            ->assertJsonPath('sessions.data.0.treatment_details', 'Initial laser consultation')
            ->assertJsonPath('sessions.data.0.master_appointment.appointment_number', 'MAPT-20261103-0001')
            ->assertJsonPath('sessions.data.0.master_appointment.customer.name', 'Sunil Verma')
            ->assertJsonFragment(['appointment_number' => 'MAPT-20261103-0001'])
            ->assertJsonMissing(['appointment_number' => 'MAPT-20261103-0002']);
    }

    /**
     * Test staff can view single appointment session details with master image and session image.
     */
    public function test_staff_can_view_single_appointment_details_with_images(): void
    {
        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0005',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => '2026-11-03',
            'appointment_fees' => 3000.00,
            'notes' => 'Prescription attached',
            'image' => 'appointments/allergy_scan.png',
            'admin_id' => $this->admin->id,
        ]);

        $session = AppointmentSession::create([
            'master_appointment_id' => $mapt->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Dermatological assessment',
            'session_date' => '2026-11-03',
            'session_time' => '02:00 PM',
            'staff_id' => $this->staff1->id,
            'staff_commission' => 600.00,
            'status' => AppointmentSession::STATUS_PENDING,
            'image' => 'sessions/skin_lesion_01.jpg',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->getJson('/api/admin/my-appointments/'.$session->id);

        $res->assertStatus(200)
            ->assertJsonPath('session.id', $session->id)
            ->assertJsonPath('session.image', 'sessions/skin_lesion_01.jpg')
            ->assertJsonPath('appointment.appointment_number', 'MAPT-20261103-0005')
            ->assertJsonPath('appointment.image', 'appointments/allergy_scan.png');

        $this->assertNotNull($res->json('session.image_url'));
        $this->assertNotNull($res->json('appointment.image_url'));
    }

    /**
     * Test staff cannot view appointment details they are not assigned to.
     */
    public function test_staff_cannot_view_unassigned_appointment_details(): void
    {
        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0099',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => '2026-11-03',
            'appointment_fees' => 1000.00,
            'admin_id' => $this->admin->id,
        ]);

        $session = AppointmentSession::create([
            'master_appointment_id' => $mapt->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Dr Vikram only session',
            'session_date' => '2026-11-03',
            'session_time' => '04:00 PM',
            'staff_id' => $this->staff2->id,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        // Staff 1 tries to access Dr Vikram's appointment session
        $res = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->getJson('/api/admin/my-appointments/'.$session->id);

        $res->assertStatus(404)
            ->assertJsonPath('message', 'Appointment session record not found or you are not assigned to it.');
    }

    /**
     * Test Admin is forbidden from calling my-appointments endpoint (staff only).
     */
    public function test_admin_is_forbidden_from_my_appointments(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer '.$this->adminToken)
            ->getJson('/api/admin/my-appointments');

        $res->assertStatus(403)
            ->assertJsonPath('message', 'Access restricted to staff members only.');
    }

    /**
     * Test staff can update session status (pending -> in_progress -> completed).
     */
    public function test_staff_can_update_session_status(): void
    {
        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0101',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => now()->toDateString(),
            'appointment_fees' => 2000.00,
            'admin_id' => $this->admin->id,
        ]);

        $session = AppointmentSession::create([
            'master_appointment_id' => $mapt->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Skin checkup session',
            'session_date' => now()->toDateString(),
            'session_time' => '11:00 AM',
            'staff_id' => $this->staff1->id,
            'staff_commission' => 400.00,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        // 1. Update to in_progress
        $res1 = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->patchJson('/api/admin/my-appointments/'.$session->id.'/status', [
                'status' => 'in_progress',
            ]);

        $res1->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('session.status', 'in_progress');

        $this->assertEquals('in_progress', $session->fresh()->status);

        // 2. Update to completed (Session closed) and receive payment
        $res2 = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->patchJson('/api/admin/my-appointments/'.$session->id.'/status', [
                'status' => 'completed',
                'payment_amount' => 1500.00,
                'payment_date' => now()->toDateString(),
                'payment_mode' => 'cash',
                'payment_notes' => 'Patient paid in cash at reception',
            ]);

        $res2->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('session.status', 'completed');

        $fresh = $session->fresh();
        $this->assertEquals('completed', $fresh->status);
        $this->assertEquals(1500.00, (float) $fresh->payment_amount);
        $this->assertEquals('cash', $fresh->payment_mode);
        $this->assertEquals('Patient paid in cash at reception', $fresh->payment_notes);
    }

    /**
     * Test staff can upload session clinical photo.
     */
    public function test_staff_can_upload_session_image(): void
    {
        Storage::fake('public');

        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261103-0102',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => now()->toDateString(),
            'appointment_fees' => 2000.00,
            'admin_id' => $this->admin->id,
        ]);

        $session = AppointmentSession::create([
            'master_appointment_id' => $mapt->id,
            'session_number' => 1,
            'service_id' => $this->service->id,
            'treatment_details' => 'Skin checkup session',
            'session_date' => now()->toDateString(),
            'session_time' => '11:00 AM',
            'staff_id' => $this->staff1->id,
            'staff_commission' => 400.00,
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        $file = UploadedFile::fake()->image('clinical_photo.jpg');

        $res = $this->withHeader('Authorization', 'Bearer '.$this->staff1Token)
            ->postJson('/api/admin/my-appointments/'.$session->id.'/image', [
                'image' => $file,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertNotNull($session->fresh()->image);
        Storage::disk('public')->assertExists($session->fresh()->image);
    }
}
