<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('payouts')) {
            // Modify payout_type to support 'sales'
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                DB::statement("ALTER TABLE `payouts` MODIFY COLUMN `payout_type` VARCHAR(50) NOT NULL");
            }

            Schema::table('payouts', function (Blueprint $table) {
                if (! Schema::hasColumn('payouts', 'sales_member_id')) {
                    $table->foreignId('sales_member_id')
                        ->nullable()
                        ->after('vendor_id')
                        ->constrained('sales_members')
                        ->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payouts')) {
            Schema::table('payouts', function (Blueprint $table) {
                if (Schema::hasColumn('payouts', 'sales_member_id')) {
                    $table->dropForeign(['sales_member_id']);
                    $table->dropColumn('sales_member_id');
                }
            });

            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                DB::statement("ALTER TABLE `payouts` MODIFY COLUMN `payout_type` ENUM('staff', 'vendor') NOT NULL");
            }
        }
    }
};
