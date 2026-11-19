<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AppointmentPayment;
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
use Tests\TestCase;

class AppointmentPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected SuperAdmin $superAdmin;
    protected Admin $admin;
    protected string $adminToken;
    protected Staff $staff;
    protected Customer $customer;
    protected SalesMember $salesMember;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Hospital Governance',
            'email' => 'governance_' . uniqid() . '@example.com',
            'password' => Hash::make('Password@123'),
            'is_active' => true,
        ]);

        $this->admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Reception Admin',
            'email' => 'admin_' . uniqid() . '@example.com',
            'mobile' => '9111122222',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);
        $this->adminToken = $this->admin->createToken('admin-token', ['role:admin'])->plainTextToken;

        $this->staff = Staff::create([
            'staff_code' => 'STF-DOC-01',
            'name' => 'Dr. Ayesha',
            'email' => 'ayesha_' . uniqid() . '@example.com',
            'mobile' => '9888811111',
            'department' => 'Dermatology',
            'designation' => 'Doctor',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);

        $this->customer = Customer::create([
            'name' => 'Reena Verma',
            'email' => 'reena_' . uniqid() . '@example.com',
            'mobile' => '9874561235',
            'gender' => 'female',
            'age' => 28,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $this->salesMember = SalesMember::create([
            'sales_code' => 'SAL-0004',
            'name' => 'Vimmy',
            'email' => 'vimmy_' . uniqid() . '@example.com',
            'mobile' => '9999900004',
            'department' => 'B2B Sales',
            'commission_rate' => 10.00,
            'created_by_superadmin_id' => $this->superAdmin->id,
        ]);
    }

    /**
     * Test sequential FIFO session payment allocation and multiple installment receipts.
     */
    public function test_fifo_session_payment_allocation_across_installments(): void
    {
        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261119-0001',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => now()->toDateString(),
            'appointment_fees' => 6000.00,
            'admin_id' => $this->admin->id,
        ]);

        // Create 6 sessions: 500, 700, 800, 1000, 1500, 1500 = Total 6000
        $fees = [500.00, 700.00, 800.00, 1000.00, 1500.00, 1500.00];
        $sessionIds = [];
        foreach ($fees as $idx => $fee) {
            $s = AppointmentSession::create([
                'master_appointment_id' => $mapt->id,
                'session_number' => $idx + 1,
                'treatment_details' => 'Procedure #' . ($idx + 1),
                'consultation_fee' => $fee,
                'staff_id' => $this->staff->id,
                'session_date' => now()->toDateString(),
                'session_time' => '10:00 AM',
                'status' => AppointmentSession::STATUS_PENDING,
            ]);
            $sessionIds[] = $s->id;
        }

        // Installment 1: Collect 4500
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/master-appointments/{$mapt->id}/payments", [
                'amount' => 4500.00,
                'payment_mode' => 'cash',
                'payment_notes' => 'First installment received',
            ]);

        $res1->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('payment.amount', '4500.00')
            ->assertJsonPath('payment.previous_paid_amount', '0.00')
            ->assertJsonPath('payment.current_paid_amount', '4500.00')
            ->assertJsonPath('payment.balance_remaining', '1500.00')
            ->assertJsonPath('appointment.total_paid', 4500)
            ->assertJsonPath('appointment.balance_remaining', 1500)
            ->assertJsonPath('appointment.payment_status', 'partial');

        // Check sessions after installment 1:
        // Sessions 1-5 sum: 500 + 700 + 800 + 1000 + 1500 = 4500 -> ALL PAID!
        // Session 6: 1500 fee -> 0 paid, balance 1500
        $sessions = AppointmentSession::where('master_appointment_id', $mapt->id)
            ->orderBy('session_number')
            ->get();

        $this->assertEquals(500.00, (float) $sessions[0]->payment_amount);
        $this->assertEquals(700.00, (float) $sessions[1]->payment_amount);
        $this->assertEquals(800.00, (float) $sessions[2]->payment_amount);
        $this->assertEquals(1000.00, (float) $sessions[3]->payment_amount);
        $this->assertEquals(1500.00, (float) $sessions[4]->payment_amount);
        $this->assertEquals(0.00, (float) $sessions[5]->payment_amount);

        // Installment 2: Collect 1000
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/master-appointments/{$mapt->id}/payments", [
                'amount' => 1000.00,
                'payment_mode' => 'upi',
                'payment_notes' => 'Second installment via UPI',
            ]);

        $res2->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('payment.amount', '1000.00')
            ->assertJsonPath('payment.previous_paid_amount', '4500.00')
            ->assertJsonPath('payment.current_paid_amount', '5500.00')
            ->assertJsonPath('payment.balance_remaining', '500.00')
            ->assertJsonPath('appointment.total_paid', 5500)
            ->assertJsonPath('appointment.balance_remaining', 500);

        // Session 6 now has 1000 paid, balance 500
        $session6 = AppointmentSession::find($sessionIds[5]);
        $this->assertEquals(1000.00, (float) $session6->payment_amount);

        // Installment 3: Collect remaining 500
        $res3 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/master-appointments/{$mapt->id}/payments", [
                'amount' => 500.00,
                'payment_mode' => 'card',
                'payment_notes' => 'Final settlement',
            ]);

        $res3->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('payment.amount', '500.00')
            ->assertJsonPath('payment.balance_remaining', '0.00')
            ->assertJsonPath('appointment.total_paid', 6000)
            ->assertJsonPath('appointment.balance_remaining', 0)
            ->assertJsonPath('appointment.payment_status', 'paid');

        $session6->refresh();
        $this->assertEquals(1500.00, (float) $session6->payment_amount);

        // Fetch payment history
        $resHistory = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/master-appointments/{$mapt->id}/payments");

        $resHistory->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');

        // Fetch single payment receipt
        $payment1Id = $res1->json('payment.id');
        $resReceipt = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/master-appointments/{$mapt->id}/payments/{$payment1Id}/receipt");

        $resReceipt->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment.amount', '4500.00');
    }

    /**
     * Test that overpaying beyond remaining balance is prevented.
     */
    public function test_cannot_collect_more_than_due_balance(): void
    {
        $mapt = MasterAppointment::create([
            'appointment_number' => 'MAPT-20261119-0002',
            'customer_id' => $this->customer->id,
            'sales_team_id' => $this->salesMember->id,
            'appointment_date' => now()->toDateString(),
            'appointment_fees' => 2000.00,
            'admin_id' => $this->admin->id,
        ]);

        AppointmentSession::create([
            'master_appointment_id' => $mapt->id,
            'session_number' => 1,
            'treatment_details' => 'Root Canal',
            'consultation_fee' => 2000.00,
            'staff_id' => $this->staff->id,
            'session_date' => now()->toDateString(),
            'session_time' => '10:00 AM',
            'status' => AppointmentSession::STATUS_PENDING,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/master-appointments/{$mapt->id}/payments", [
                'amount' => 2500.00,
                'payment_mode' => 'cash',
            ]);

        $res->assertStatus(422)
            ->assertJsonPath('message', 'Payment amount (₹2,500.00) exceeds the remaining balance of ₹2,000.00.');
    }
}
