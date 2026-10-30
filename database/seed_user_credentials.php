<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Admin;
use App\Models\SuperAdmin;
use Illuminate\Support\Facades\Hash;

// 1. Super Admin with superadmin@gmail.com and password 123456
$sa1 = SuperAdmin::updateOrCreate(
    ['email' => 'superadmin@gmail.com'],
    [
        'name' => 'Super Admin',
        'password' => Hash::make('123456'),
        'is_active' => true,
    ]
);

// 2. Super Admin with superadmin@example.com and password 123456
$sa2 = SuperAdmin::updateOrCreate(
    ['email' => 'superadmin@example.com'],
    [
        'name' => 'Chief Super Admin',
        'password' => Hash::make('123456'),
        'is_active' => true,
    ]
);

// 3. Admin with admin@gmail.com and password 123456
$a1 = Admin::updateOrCreate(
    ['email' => 'admin@gmail.com'],
    [
        'name' => 'Admin User',
        'super_admin_id' => $sa1->id,
        'password' => Hash::make('123456'),
        'is_active' => true,
    ]
);

// 4. Admin with admin@example.com and password 123456
$a2 = Admin::updateOrCreate(
    ['email' => 'admin@example.com'],
    [
        'name' => 'General Admin',
        'super_admin_id' => $sa1->id,
        'password' => Hash::make('123456'),
        'is_active' => true,
    ]
);

echo "UPDATED_SUCCESSFULLY\n";
echo "SuperAdmin: " . $sa1->email . " / 123456\n";
echo "SuperAdmin: " . $sa2->email . " / 123456\n";
echo "Admin: " . $a1->email . " / 123456\n";
echo "Admin: " . $a2->email . " / 123456\n";

