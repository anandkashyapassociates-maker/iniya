<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Customer $customer;
    protected Staff $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'name' => 'Operational Admin',
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
            'status' => 'active',
        ]);

        $this->customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Pooja Verma',
            'mobile' => '9811223344',
            'email' => 'pooja@example.com',
            'gender' => 'female',
            'age' => 26,
            'address' => '24 Park Street, Jaipur',
            'is_active' => true,
        ]);

        $this->staff = Staff::create([
            'staff_code' => 'STF-0099',
            'name' => 'Dr. Amit Sharma',
            'email' => 'amit_staff_' . uniqid() . '@example.com',
            'mobile' => '9988776655',
            'department' => 'Dermatology',
            'designation' => 'Senior Specialist',
            'status' => 'active',
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_appointments_api(): void
    {
        $response = $this->getJson('/api/admin/appointments');
        $response->assertStatus(401);
    }

    public function test_admin_can_list_appointments_and_get_stats(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        Appointment::create([
            'appointment_number' => 'APT-20261030-0001',
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '11:00 AM',
            'session_slot' => 'Morning',
            'session_number' => 1,
            'total_sessions' => 3,
            'treatment_name' => 'Skin Therapy',
            'treatment_details' => 'Initial laser skin consultation and assessment.',
            'status' => 'scheduled',
            'fee' => 1200.00,
            'payment_status' => 'paid',
        ]);

        $listResponse = $this->getJson('/api/admin/appointments');
        $listResponse->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.appointment_number', 'APT-20261030-0001')
            ->assertJsonPath('data.0.customer.name', 'Pooja Verma')
            ->assertJsonPath('data.0.staff.name', 'Dr. Amit Sharma')
            ->assertJsonPath('data.0.session_number', 1)
            ->assertJsonPath('data.0.total_sessions', 3);

        $statsResponse = $this->getJson('/api/admin/appointments/stats');
        $statsResponse->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('today', 1)
            ->assertJsonPath('scheduled', 1);
    }

    public function test_admin_can_book_an_appointment(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $payload = [
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '02:30 PM',
            'session_slot' => 'Afternoon',
            'session_number' => 1,
            'total_sessions' => 4,
            'treatment_name' => 'Physiotherapy Rehab',
            'treatment_details' => 'Lower back decompression and mobility exercises.',
            'fee' => 850.00,
            'payment_status' => 'pending',
            'notes' => 'Patient advised not to exert before session.',
        ];

        $response = $this->postJson('/api/admin/appointments', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Appointment booked successfully.')
            ->assertJsonPath('appointment.customer_id', $this->customer->id)
            ->assertJsonPath('appointment.staff_id', $this->staff->id)
            ->assertJsonPath('appointment.treatment_name', 'Physiotherapy Rehab')
            ->assertJsonPath('appointment.session_slot', 'Afternoon')
            ->assertJsonPath('appointment.session_number', 1)
            ->assertJsonPath('appointment.total_sessions', 4)
            ->assertJsonPath('appointment.status', 'scheduled');

        $this->assertDatabaseHas('appointments', [
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'treatment_name' => 'Physiotherapy Rehab',
            'session_slot' => 'Afternoon',
            'session_number' => 1,
            'total_sessions' => 4,
        ]);
    }

    public function test_appointment_validation_rules(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        // Missing required fields
        $response = $this->postJson('/api/admin/appointments', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'customer_id',
                'appointment_date',
                'appointment_time',
                'session_slot',
                'session_number',
                'total_sessions',
                'treatment_name',
            ]);

        // total_sessions must be gte session_number
        $response2 = $this->postJson('/api/admin/appointments', [
            'customer_id' => $this->customer->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00 AM',
            'session_slot' => 'Morning',
            'session_number' => 5,
            'total_sessions' => 2,
            'treatment_name' => 'Dental',
        ]);
        $response2->assertStatus(422)->assertJsonValidationErrors(['total_sessions']);
    }

    public function test_admin_can_reschedule_appointment(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $originalDate = now()->toDateString();
        $appointment = Appointment::create([
            'appointment_number' => 'APT-20261030-0002',
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $originalDate,
            'appointment_time' => '10:00 AM',
            'session_slot' => 'Morning',
            'session_number' => 2,
            'total_sessions' => 5,
            'treatment_name' => 'Dental Root Canal',
            'status' => 'scheduled',
        ]);

        $newDate = now()->addDays(3)->toDateString();
        $response = $this->postJson("/api/admin/appointments/{$appointment->id}/reschedule", [
            'appointment_date' => $newDate,
            'appointment_time' => '04:00 PM',
            'session_slot' => 'Evening',
            'reason' => 'Patient had a business conflict on original date.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Appointment rescheduled successfully.')
            ->assertJsonPath('appointment.status', 'rescheduled')
            ->assertJsonPath('appointment.appointment_time', '04:00 PM')
            ->assertJsonPath('appointment.session_slot', 'Evening')
            ->assertJsonPath('appointment.rescheduled_reason', 'Patient had a business conflict on original date.');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'rescheduled',
            'previous_appointment_date' => $originalDate,
            'previous_appointment_time' => '10:00 AM',
            'previous_session_slot' => 'Morning',
            'appointment_time' => '04:00 PM',
        ]);
    }

    public function test_admin_cannot_reschedule_cancelled_appointment(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $appointment = Appointment::create([
            'appointment_number' => 'APT-20261030-0003',
            'customer_id' => $this->customer->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00 AM',
            'session_slot' => 'Morning',
            'session_number' => 1,
            'total_sessions' => 1,
            'treatment_name' => 'Consultation',
            'status' => 'cancelled',
            'cancellation_reason' => 'User requested cancellation',
        ]);

        $response = $this->postJson("/api/admin/appointments/{$appointment->id}/reschedule", [
            'appointment_date' => now()->addDays(1)->toDateString(),
            'appointment_time' => '11:00 AM',
            'session_slot' => 'Morning',
            'reason' => 'Try to revive',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cancelled appointments cannot be rescheduled.');
    }

    public function test_admin_can_cancel_appointment_with_reason(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $appointment = Appointment::create([
            'appointment_number' => 'APT-20261030-0004',
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '03:00 PM',
            'session_slot' => 'Afternoon',
            'session_number' => 1,
            'total_sessions' => 1,
            'treatment_name' => 'Acupuncture',
            'status' => 'scheduled',
        ]);

        $response = $this->postJson("/api/admin/appointments/{$appointment->id}/cancel", [
            'reason' => 'Emergency travel by patient.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Appointment cancelled successfully.')
            ->assertJsonPath('appointment.status', 'cancelled')
            ->assertJsonPath('appointment.cancellation_reason', 'Emergency travel by patient.');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Emergency travel by patient.',
        ]);
    }

    public function test_admin_can_assign_staff_to_appointment(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $appointment = Appointment::create([
            'appointment_number' => 'APT-20261030-0005',
            'customer_id' => $this->customer->id,
            'staff_id' => null,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '11:30 AM',
            'session_slot' => 'Morning',
            'session_number' => 1,
            'total_sessions' => 2,
            'treatment_name' => 'Orthopedic Evaluation',
            'status' => 'scheduled',
        ]);

        $response = $this->postJson("/api/admin/appointments/{$appointment->id}/assign-staff", [
            'staff_id' => $this->staff->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('appointment.staff_id', $this->staff->id)
            ->assertJsonPath('appointment.staff.name', 'Dr. Amit Sharma');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'staff_id' => $this->staff->id,
        ]);
    }

    public function test_admin_can_update_appointment_status(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $appointment = Appointment::create([
            'appointment_number' => 'APT-20261030-0006',
            'customer_id' => $this->customer->id,
            'staff_id' => $this->staff->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00 AM',
            'session_slot' => 'Morning',
            'session_number' => 1,
            'total_sessions' => 1,
            'treatment_name' => 'General Checkup',
            'status' => 'scheduled',
        ]);

        $response = $this->patchJson("/api/admin/appointments/{$appointment->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('appointment.status', 'completed');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'completed',
        ]);
    }

    public function test_admin_can_fetch_staff_and_customer_options(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $staffRes = $this->getJson('/api/admin/staff-options');
        $staffRes->assertStatus(200)
            ->assertJsonFragment(['name' => 'Dr. Amit Sharma', 'staff_code' => 'STF-0099']);

        $customerRes = $this->getJson('/api/admin/customer-options');
        $customerRes->assertStatus(200)
            ->assertJsonFragment(['name' => 'Pooja Verma', 'mobile' => '9811223344']);
    }
}
