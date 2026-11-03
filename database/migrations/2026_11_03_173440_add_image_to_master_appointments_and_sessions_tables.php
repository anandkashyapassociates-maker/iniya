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
        if (Schema::hasTable('master_appointments') && ! Schema::hasColumn('master_appointments', 'image')) {
            Schema::table('master_appointments', function (Blueprint $table) {
                $table->string('image', 500)->nullable()->after('notes');
            });
        }

        if (Schema::hasTable('appointment_sessions') && ! Schema::hasColumn('appointment_sessions', 'image')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                $table->string('image', 500)->nullable()->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('master_appointments') && Schema::hasColumn('master_appointments', 'image')) {
            Schema::table('master_appointments', function (Blueprint $table) {
                $table->dropColumn('image');
            });
        }

        if (Schema::hasTable('appointment_sessions') && Schema::hasColumn('appointment_sessions', 'image')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                $table->dropColumn('image');
            });
        }
    }
};
