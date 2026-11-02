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
        // 1. master_appointments table
        Schema::create('master_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_number', 50)->unique();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->date('appointment_date')->index();
            $table->foreignId('sales_team_id')->constrained('sales_members')->restrictOnDelete();
            $table->decimal('appointment_fees', 10, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();
        });

        // 2. appointment_sessions table
        Schema::create('appointment_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_appointment_id')->constrained('master_appointments')->cascadeOnDelete();
            $table->unsignedInteger('session_number')->default(1);
            $table->text('treatment_details');
            $table->date('session_date')->index();
            $table->string('session_time', 20);
            $table->foreignId('staff_id')->constrained('staff')->restrictOnDelete();
            $table->decimal('staff_commission', 10, 2)->default(0.00);
            $table->foreignId('inventory_product_id')->nullable()->constrained('inventory_products')->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending')->index();
            $table->timestamps();
        });

        // 3. appointment_reschedule_history table
        Schema::create('appointment_reschedule_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('appointment_sessions')->cascadeOnDelete();
            $table->date('old_date');
            $table->string('old_time', 20);
            $table->foreignId('old_staff_id')->constrained('staff')->restrictOnDelete();
            $table->date('new_date');
            $table->string('new_time', 20);
            $table->foreignId('new_staff_id')->constrained('staff')->restrictOnDelete();
            $table->text('reschedule_reason')->nullable();
            $table->string('rescheduled_by', 150)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_reschedule_history');
        Schema::dropIfExists('appointment_sessions');
        Schema::dropIfExists('master_appointments');
    }
};
