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
        if (Schema::hasTable('inventory_products') && ! Schema::hasColumn('inventory_products', 'is_used')) {
            Schema::table('inventory_products', function (Blueprint $table) {
                $table->boolean('is_used')->default(false)->after('status')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('inventory_products') && Schema::hasColumn('inventory_products', 'is_used')) {
            Schema::table('inventory_products', function (Blueprint $table) {
                $table->dropColumn('is_used');
            });
        }
    }
};
