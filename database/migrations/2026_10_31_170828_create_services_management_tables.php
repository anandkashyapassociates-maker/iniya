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
        if (! Schema::hasTable('service_categories')) {
            Schema::create('service_categories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('parent_id')->nullable()->index();
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->enum('type', ['category', 'sub_category'])->default('category')->index();
                $table->enum('status', ['active', 'inactive'])->default('active')->index();
                $table->timestamps();

                $table->foreign('parent_id')
                    ->references('id')
                    ->on('service_categories')
                    ->restrictOnDelete();
            });
        }

        if (! Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('service_category_id')->index();
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->decimal('price', 10, 2)->default(0.00);
                $table->enum('status', ['active', 'inactive'])->default('active')->index();
                $table->timestamps();

                $table->foreign('service_category_id')
                    ->references('id')
                    ->on('service_categories')
                    ->restrictOnDelete();
            });
        }

        if (Schema::hasTable('appointment_sessions')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('appointment_sessions', 'service_id')) {
                    $table->unsignedBigInteger('service_id')->nullable()->after('treatment_details')->index();
                    $table->foreign('service_id')
                        ->references('id')
                        ->on('services')
                        ->restrictOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('appointment_sessions')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('appointment_sessions', 'service_id')) {
                    $table->dropForeign(['service_id']);
                    $table->dropColumn('service_id');
                }
            });
        }

        Schema::dropIfExists('services');
        Schema::dropIfExists('service_categories');
    }
};
