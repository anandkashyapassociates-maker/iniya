<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\AdminActivityLog;
use App\Models\SuperAdmin;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = env('INITIAL_SUPERADMIN_EMAIL', 'superadmin@example.com');
        $password = env('INITIAL_SUPERADMIN_PASSWORD', 'SuperAdmin@2026!');
        $name = env('INITIAL_SUPERADMIN_NAME', 'Chief Super Admin');

        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'is_active' => true,
                'email_verified_at' => Carbon::now(),
            ]
        );

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'superadmin_seeded',
            "Initial Super Admin '{$superAdmin->name}' seeded."
        );

        // Also create a sample initial Admin created by this Super Admin for demonstration if none exists
        if (Admin::count() === 0) {
            $admin = Admin::create([
                'super_admin_id' => $superAdmin->id,
                'name' => 'General Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('Admin@2026!'),
                'is_active' => true,
                'email_verified_at' => Carbon::now(),
            ]);

            AdminActivityLog::record(
                'super_admin',
                $superAdmin->id,
                'admin_created',
                "Demonstration Admin account created ('{$admin->name}')."
            );
        }
    }
}

