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
        Schema::create('appointment_payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number', 50)->unique();
            $table->foreignId('master_appointment_id')
                ->constrained('master_appointments')
                ->cascadeOnDelete();
            $table->foreignId('admin_id')
                ->nullable()
                ->constrained('admins')
                ->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('payment_mode', 50)->default('cash');
            $table->text('payment_notes')->nullable();
            $table->decimal('total_appointment_fees', 10, 2)->default(0.00);
            $table->decimal('previous_paid_amount', 10, 2)->default(0.00);
            $table->decimal('current_paid_amount', 10, 2)->default(0.00);
            $table->decimal('balance_remaining', 10, 2)->default(0.00);
            $table->json('session_allocations')->nullable();
            $table->timestamps();

            $table->index(['master_appointment_id', 'payment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_payments');
    }
};
