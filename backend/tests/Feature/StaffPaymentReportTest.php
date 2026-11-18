<?php

namespace Tests\Feature;

use App\Models\AppointmentSession;
use App\Models\Clinic;
use App\Models\MasterAppointment;
use App\Models\Payout;
use App\Models\Staff;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffPaymentReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_their_payments_report_and_summary(): void
    {
        $clinic = Clinic::create([
            'clinic_code' => 'CLN-0001',
            'name' => 'Main Flagship Clinic',
            'branch_name' => 'Delhi East',
            'location' => 'Delhi East',
            'address' => 'Delhi East Address',
            'phone' => '0123456789',
            'status' => 'active',
        ]);

        $superAdmin = SuperAdmin::create([
            'name' => 'Root SuperAdmin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password123'),
        ]);

        $staff = Staff::create([
            'staff_code' => 'STF-0001',
            'clinic_id' => $clinic->id,
            'name' => 'Dr. Ravi',
            'email' => 'ravi@example.com',
            'password' => bcrypt('password123'),
            'mobile' => '9876543210',
            'department' => 'Physiotherapy',
            'designation' => 'Specialist',
            'status' => 'active',
        ]);

        // Create a payout for this staff
        $payout = Payout::create([
            'payout_number' => 'PAY-STF-0001',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'total_amount' => 5000.00,
            'amount' => 5000.00,
            'paid_amount' => 4000.00,
            'balance_amount' => 1000.00,
            'payout_date' => now()->toDateString(),
            'account_type' => Payout::ACCOUNT_BANK,
            'reference_number' => 'UTR99887766',
            'note' => 'Monthly staff commission disbursement',
            'status' => 'completed',
            'created_by_superadmin_id' => $superAdmin->id,
        ]);

        // Request as logged-in Staff
        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/admin/my-payments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'payouts' => [
                    'data',
                    'current_page',
                    'total',
                ],
                'summary' => [
                    'total_payout_amount',
                    'total_paid_amount',
                    'total_balance_amount',
                    'total_vouchers_count',
                ],
                'staff' => [
                    'id',
                    'name',
                    'staff_code',
                ],
            ]);

        $this->assertEquals(4000.00, $response->json('summary.total_paid_amount'));
        $this->assertEquals(1000.00, $response->json('summary.total_balance_amount'));
        $this->assertEquals(1, $response->json('summary.total_vouchers_count'));
    }

    public function test_staff_can_view_specific_payout_voucher(): void
    {
        $clinic = Clinic::create([
            'clinic_code' => 'CLN-0001',
            'name' => 'Main Flagship Clinic',
            'branch_name' => 'Delhi East',
            'location' => 'Delhi East',
            'address' => 'Delhi East Address',
            'phone' => '0123456789',
            'status' => 'active',
        ]);

        $staff = Staff::create([
            'staff_code' => 'STF-0002',
            'clinic_id' => $clinic->id,
            'name' => 'Dr. Sharma',
            'email' => 'sharma@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $payout = Payout::create([
            'payout_number' => 'PAY-STF-0002',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff->id,
            'total_amount' => 3500.00,
            'amount' => 3500.00,
            'paid_amount' => 3500.00,
            'balance_amount' => 0.00,
            'payout_date' => now()->toDateString(),
            'account_type' => Payout::ACCOUNT_CASH,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson("/api/admin/my-payments/voucher/{$payout->id}");

        $response->assertStatus(200)
            ->assertJsonPath('payout.payout_number', 'PAY-STF-0002');
    }

    public function test_staff_cannot_view_another_staff_payout_voucher(): void
    {
        $clinic = Clinic::create([
            'clinic_code' => 'CLN-0003',
            'name' => 'Main Flagship Clinic',
            'branch_name' => 'Delhi East',
            'location' => 'Delhi East',
            'address' => 'Delhi East Address',
            'phone' => '0123456789',
            'status' => 'active',
        ]);

        $staff1 = Staff::create([
            'staff_code' => 'STF-0003',
            'clinic_id' => $clinic->id,
            'name' => 'Dr. First',
            'email' => 'first@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $staff2 = Staff::create([
            'staff_code' => 'STF-0004',
            'clinic_id' => $clinic->id,
            'name' => 'Dr. Second',
            'email' => 'second@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $payoutStaff1 = Payout::create([
            'payout_number' => 'PAY-STF-0003',
            'payout_type' => Payout::TYPE_STAFF,
            'staff_id' => $staff1->id,
            'amount' => 1000.00,
            'payout_date' => now()->toDateString(),
            'account_type' => Payout::ACCOUNT_CASH,
            'status' => 'completed',
        ]);

        // Staff2 tries to view Staff1's voucher
        $response = $this->actingAs($staff2, 'sanctum')
            ->getJson("/api/admin/my-payments/voucher/{$payoutStaff1->id}");

        $response->assertStatus(404);
    }
}
