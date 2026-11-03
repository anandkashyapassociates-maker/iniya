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
        Schema::table('payouts', function (Blueprint $table) {
            if (! Schema::hasColumn('payouts', 'total_amount')) {
                $table->decimal('total_amount', 12, 2)->default(0.00)->after('vendor_id');
            }
            if (! Schema::hasColumn('payouts', 'paid_amount')) {
                $table->decimal('paid_amount', 12, 2)->default(0.00)->after('amount');
            }
            if (! Schema::hasColumn('payouts', 'balance_amount')) {
                $table->decimal('balance_amount', 12, 2)->default(0.00)->after('paid_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $dropCols = [];
            if (Schema::hasColumn('payouts', 'balance_amount')) {
                $dropCols[] = 'balance_amount';
            }
            if (Schema::hasColumn('payouts', 'paid_amount')) {
                $dropCols[] = 'paid_amount';
            }
            if (Schema::hasColumn('payouts', 'total_amount')) {
                $dropCols[] = 'total_amount';
            }
            if (! empty($dropCols)) {
                $table->dropColumn($dropCols);
            }
        });
    }
};
