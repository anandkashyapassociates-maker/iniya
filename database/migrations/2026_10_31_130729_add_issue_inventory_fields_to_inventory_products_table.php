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
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->integer('last_issued_quantity')->nullable()->after('last_added_quantity');
            $table->timestamp('last_issued_at')->nullable()->after('inventory_updated_at');
            $table->foreignId('last_issued_by')->nullable()->after('inventory_updated_by')->constrained('admins')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->dropForeign(['last_issued_by']);
            $table->dropColumn(['last_issued_quantity', 'last_issued_at', 'last_issued_by']);
        });
    }
};
