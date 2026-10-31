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
        if (Schema::hasTable('appointment_sessions')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('appointment_sessions', 'inventory_product_ids')) {
                    $table->json('inventory_product_ids')->nullable()->after('inventory_product_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('appointment_sessions')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('appointment_sessions', 'inventory_product_ids')) {
                    $table->dropColumn('inventory_product_ids');
                }
            });
        }
    }
};
