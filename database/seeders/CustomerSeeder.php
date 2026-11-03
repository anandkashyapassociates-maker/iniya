<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::first();
        $adminId = $admin ? $admin->id : null;

        Customer::firstOrCreate(
            ['mobile' => '9876543210'],
            [
                'admin_id' => $adminId,
                'name' => 'Amit Sharma',
                'email' => 'amit.sharma@example.com',
                'gender' => 'male',
                'age' => 30,
                'address' => '402 Sunrise Heights, MG Road, Mumbai',
                'is_active' => true,
            ]
        );

        Customer::firstOrCreate(
            ['mobile' => '9812345678'],
            [
                'admin_id' => $adminId,
                'name' => 'Pooja Verma',
                'email' => 'pooja.verma@example.com',
                'gender' => 'female',
                'age' => 26,
                'address' => 'B-12 Sector 18, Noida',
                'is_active' => true,
            ]
        );

        Customer::firstOrCreate(
            ['mobile' => '9900112233'],
            [
                'admin_id' => $adminId,
                'name' => 'Vikram Rathore',
                'email' => 'vikram.rathore@example.com',
                'gender' => 'male',
                'age' => 35,
                'address' => 'C-55 Malviya Nagar, Jaipur',
                'is_active' => true,
            ]
        );
    }
}
