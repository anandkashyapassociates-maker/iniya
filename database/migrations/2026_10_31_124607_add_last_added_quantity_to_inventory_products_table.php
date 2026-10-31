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
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->integer('last_added_quantity')->nullable()->after('quantity');
        });

        // Backfill last_added_quantity from inventory_stock_logs or current quantity
        $products = DB::table('inventory_products')->get();
        foreach ($products as $prod) {
            $latestLog = DB::table('inventory_stock_logs')
                ->where('product_id', $prod->id)
                ->orderBy('id', 'desc')
                ->first();

            $qty = $latestLog ? (int) $latestLog->quantity : (int) $prod->quantity;
            if ($qty > 0) {
                DB::table('inventory_products')
                    ->where('id', $prod->id)
                    ->update(['last_added_quantity' => $qty]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->dropColumn('last_added_quantity');
        });
    }
};
