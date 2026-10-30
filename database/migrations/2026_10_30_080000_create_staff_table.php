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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('staff_code', 30)->unique()->index();
            $table->string('name', 255);
            $table->string('email', 255)->unique();
            $table->string('mobile', 25)->nullable()->index();
            $table->string('department', 100)->nullable()->index();
            $table->string('designation', 100)->nullable();
            $table->string('employment_type', 50)->nullable()->index();
            $table->date('joining_date')->nullable();
            $table->text('address')->nullable();
            $table->string('profile_photo', 255)->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by_superadmin_id')
                ->nullable()
                ->constrained('super_admins')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};

