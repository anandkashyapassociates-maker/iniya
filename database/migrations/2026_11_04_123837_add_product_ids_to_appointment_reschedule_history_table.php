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
        if (Schema::hasTable('appointment_reschedule_history')) {
            Schema::table('appointment_reschedule_history', function (Blueprint $table) {
                if (! Schema::hasColumn('appointment_reschedule_history', 'old_inventory_product_ids')) {
                    $table->json('old_inventory_product_ids')->nullable()->after('old_commission');
                }
                if (! Schema::hasColumn('appointment_reschedule_history', 'new_inventory_product_ids')) {
                    $table->json('new_inventory_product_ids')->nullable()->after('new_commission');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('appointment_reschedule_history')) {
            Schema::table('appointment_reschedule_history', function (Blueprint $table) {
                if (Schema::hasColumn('appointment_reschedule_history', 'new_inventory_product_ids')) {
                    $table->dropColumn('new_inventory_product_ids');
                }
                if (Schema::hasColumn('appointment_reschedule_history', 'old_inventory_product_ids')) {
                    $table->dropColumn('old_inventory_product_ids');
                }
            });
        }
    }
};
