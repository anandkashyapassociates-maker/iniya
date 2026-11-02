<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Preserving appointments table for legacy compatibility and data safety
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Table was replaced by master_appointments and appointment_sessions
    }
};
