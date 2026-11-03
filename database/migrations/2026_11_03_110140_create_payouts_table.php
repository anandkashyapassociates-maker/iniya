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
        if (! Schema::hasTable('payouts')) {
            Schema::create('payouts', function (Blueprint $table) {
                $table->id();
                $table->string('payout_number', 50)->unique()->index();
                $table->enum('payout_type', ['staff', 'vendor'])->index();
                $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->date('payout_date')->index();
                $table->enum('account_type', ['Cash', 'Bank'])->default('Cash')->index();
                $table->string('reference_number', 100)->nullable();
                $table->text('note')->nullable();
                $table->string('status', 20)->default('completed')->index();
                $table->foreignId('created_by_superadmin_id')->nullable()->constrained('super_admins')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
