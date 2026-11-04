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
                if (! Schema::hasColumn('appointment_reschedule_history', 'old_commission')) {
                    $table->decimal('old_commission', 10, 2)->nullable()->after('old_staff_id');
                }
                if (! Schema::hasColumn('appointment_reschedule_history', 'new_commission')) {
                    $table->decimal('new_commission', 10, 2)->nullable()->after('new_staff_id');
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
                if (Schema::hasColumn('appointment_reschedule_history', 'new_commission')) {
                    $table->dropColumn('new_commission');
                }
                if (Schema::hasColumn('appointment_reschedule_history', 'old_commission')) {
                    $table->dropColumn('old_commission');
                }
            });
        }
    }
};
