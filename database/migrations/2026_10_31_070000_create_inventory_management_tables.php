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
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique()->index();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('admins')
                ->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique()->index();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('admins')
                ->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')
                ->constrained('inventory_categories')
                ->restrictOnDelete();
            $table->foreignId('brand_id')
                ->nullable()
                ->constrained('inventory_brands')
                ->nullOnDelete();
            $table->string('product_image')->nullable();
            $table->string('product_name')->index();
            $table->string('business_unit', 50)->index();
            $table->unsignedInteger('product_unit')->default(1);
            $table->string('product_type', 50)->index();
            $table->string('custom_product_type')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->boolean('is_used')->default(false)->index();
            $table->foreignId('created_by_admin_id')
                ->constrained('admins')
                ->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_products');
        Schema::dropIfExists('inventory_brands');
        Schema::dropIfExists('inventory_categories');
    }
};
