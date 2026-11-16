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
                if (! Schema::hasColumn('appointment_sessions', 'executed_by_staff_id')) {
                    $table->foreignId('executed_by_staff_id')->nullable()->after('staff_id')->constrained('staff')->nullOnDelete();
                }
                if (! Schema::hasColumn('appointment_sessions', 'consultation_fee')) {
                    $table->decimal('consultation_fee', 10, 2)->nullable()->after('service_id');
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
                if (Schema::hasColumn('appointment_sessions', 'executed_by_staff_id')) {
                    $table->dropForeign(['executed_by_staff_id']);
                    $table->dropColumn('executed_by_staff_id');
                }
                if (Schema::hasColumn('appointment_sessions', 'consultation_fee')) {
                    $table->dropColumn('consultation_fee');
                }
            });
        }
    }
};

