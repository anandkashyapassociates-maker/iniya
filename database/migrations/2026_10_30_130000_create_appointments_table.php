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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_number', 50)->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->date('appointment_date')->index();
            $table->string('appointment_time', 20);
            $table->string('session_slot', 50)->default('Morning')->index();
            $table->unsignedInteger('session_number')->default(1);
            $table->unsignedInteger('total_sessions')->default(1);
            $table->string('treatment_name');
            $table->text('treatment_details')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show'])->default('pending')->index();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('rescheduled_reason')->nullable();
            $table->date('previous_appointment_date')->nullable();
            $table->string('previous_appointment_time', 20)->nullable();
            $table->string('previous_session_slot', 50)->nullable();
            $table->timestamp('rescheduled_at')->nullable();
            $table->decimal('fee', 10, 2)->default(0.00);
            $table->enum('payment_status', ['pending', 'paid', 'waived'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['staff_id', 'appointment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
