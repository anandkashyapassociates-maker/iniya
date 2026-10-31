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
        if (! Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('admin_id')
                    ->nullable()
                    ->constrained('admins')
                    ->nullOnDelete();
                $table->string('name');
                $table->string('mobile', 30)->index();
                $table->string('email')->nullable()->index();
                $table->enum('gender', ['male', 'female', 'other'])->default('male');
                $table->unsignedInteger('age')->nullable();
                $table->text('address')->nullable();
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
