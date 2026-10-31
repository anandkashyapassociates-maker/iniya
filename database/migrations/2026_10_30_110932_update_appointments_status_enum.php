<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('appointments') && DB::getDriverName() === 'mysql') {
            // Step 1: First expand enum to include both old and new values
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled','rescheduled','completed','cancelled','no_show','pending','confirmed') NOT NULL DEFAULT 'scheduled'");

            // Step 2: Map old values to new values
            DB::table('appointments')->where('status', 'scheduled')->update(['status' => 'pending']);
            DB::table('appointments')->where('status', 'rescheduled')->update(['status' => 'pending']);
            DB::table('appointments')->where('status', 'no_show')->update(['status' => 'cancelled']);

            // Step 3: Now shrink enum to only new values
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled','rescheduled','completed','cancelled','no_show','pending','confirmed') NOT NULL DEFAULT 'pending'");

            DB::table('appointments')->where('status', 'pending')->update(['status' => 'scheduled']);
            DB::table('appointments')->where('status', 'confirmed')->update(['status' => 'scheduled']);

            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled','rescheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled'");
        }
    }
};
