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
        Schema::table('appointment_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('appointment_sessions', 'payment_amount')) {
                $table->decimal('payment_amount', 10, 2)->nullable()->after('status');
            }
            if (! Schema::hasColumn('appointment_sessions', 'payment_date')) {
                $table->date('payment_date')->nullable()->after('payment_amount');
            }
            if (! Schema::hasColumn('appointment_sessions', 'payment_mode')) {
                $table->string('payment_mode', 50)->nullable()->after('payment_date');
            }
            if (! Schema::hasColumn('appointment_sessions', 'payment_notes')) {
                $table->text('payment_notes')->nullable()->after('payment_mode');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointment_sessions', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('appointment_sessions', 'payment_notes')) {
                $cols[] = 'payment_notes';
            }
            if (Schema::hasColumn('appointment_sessions', 'payment_mode')) {
                $cols[] = 'payment_mode';
            }
            if (Schema::hasColumn('appointment_sessions', 'payment_date')) {
                $cols[] = 'payment_date';
            }
            if (Schema::hasColumn('appointment_sessions', 'payment_amount')) {
                $cols[] = 'payment_amount';
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
