<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('master_appointments') && ! Schema::hasColumn('master_appointments', 'sales_commission')) {
            Schema::table('master_appointments', function (Blueprint $table) {
                $table->decimal('sales_commission', 10, 2)->default(0.00)->after('sales_team_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('master_appointments') && Schema::hasColumn('master_appointments', 'sales_commission')) {
            Schema::table('master_appointments', function (Blueprint $table) {
                $table->dropColumn('sales_commission');
            });
        }
    }
};

