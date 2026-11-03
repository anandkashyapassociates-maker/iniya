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
            if (! Schema::hasColumn('appointment_sessions', 'image')) {
                $table->string('image', 500)->nullable()->after('treatment_details');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointment_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('appointment_sessions', 'image')) {
                $table->dropColumn('image');
            }
        });
    }
};
