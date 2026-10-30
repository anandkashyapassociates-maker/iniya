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
        if (! Schema::hasTable('sales_members')) {
            Schema::create('sales_members', function (Blueprint $table) {
                $table->id();
                $table->string('sales_code', 30)->unique();
                $table->string('name', 150)->index();
                $table->string('email', 150)->unique();
                $table->string('mobile', 20)->index();
                $table->string('alternate_mobile', 20)->nullable();
                $table->string('gender', 30)->nullable();
                $table->string('profile_photo', 255)->nullable();
                $table->string('designation', 100)->nullable()->index();
                $table->string('department', 100)->nullable()->index();
                $table->string('employment_type', 50)->nullable()->index();
                $table->date('joining_date')->nullable();
                $table->string('territory', 150)->nullable()->index();
                $table->string('city', 100)->nullable()->index();
                $table->string('state', 100)->nullable();
                $table->string('country', 100)->nullable()->default('India');
                $table->text('address')->nullable();
                $table->text('notes')->nullable();
                $table->string('status', 30)->default('active')->index();
                $table->foreignId('created_by_superadmin_id')
                    ->nullable()
                    ->constrained('super_admins')
                    ->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_members');
    }
};

