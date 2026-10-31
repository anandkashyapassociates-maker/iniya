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
        if (Schema::hasTable('inventory_products')) {
            Schema::table('inventory_products', function (Blueprint $table) {
                if (! Schema::hasColumn('inventory_products', 'quantity')) {
                    $table->unsignedInteger('quantity')->default(0)->after('product_unit')->index();
                }
                if (! Schema::hasColumn('inventory_products', 'buy_price')) {
                    $table->decimal('buy_price', 10, 2)->nullable()->after('quantity');
                }
                if (! Schema::hasColumn('inventory_products', 'mrp')) {
                    $table->decimal('mrp', 10, 2)->nullable()->after('buy_price');
                }
                if (! Schema::hasColumn('inventory_products', 'average_price')) {
                    $table->decimal('average_price', 10, 2)->nullable()->after('mrp');
                }
                if (! Schema::hasColumn('inventory_products', 'vendor_id')) {
                    $table->foreignId('vendor_id')->nullable()->after('average_price')->constrained('vendors')->nullOnDelete();
                }
                if (! Schema::hasColumn('inventory_products', 'low_stock_threshold')) {
                    $table->unsignedInteger('low_stock_threshold')->default(10)->after('vendor_id')->index();
                }
                if (! Schema::hasColumn('inventory_products', 'inventory_updated_by')) {
                    $table->foreignId('inventory_updated_by')->nullable()->after('low_stock_threshold')->constrained('admins')->nullOnDelete();
                }
                if (! Schema::hasColumn('inventory_products', 'inventory_updated_at')) {
                    $table->timestamp('inventory_updated_at')->nullable()->after('inventory_updated_by');
                }
            });
        }

        if (! Schema::hasTable('inventory_stock_logs')) {
            Schema::create('inventory_stock_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('inventory_products')->cascadeOnDelete();
                $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
                $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
                $table->integer('quantity');
                $table->string('business_unit', 50)->nullable();
                $table->decimal('buy_price', 10, 2)->nullable();
                $table->decimal('mrp', 10, 2)->nullable();
                $table->decimal('average_price', 10, 2)->nullable();
                $table->string('type', 20)->default('purchase')->index();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stock_logs');

        if (Schema::hasTable('inventory_products')) {
            Schema::table('inventory_products', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_products', 'vendor_id')) {
                    $table->dropForeign(['vendor_id']);
                }
                if (Schema::hasColumn('inventory_products', 'inventory_updated_by')) {
                    $table->dropForeign(['inventory_updated_by']);
                }
                $columns = [
                    'quantity',
                    'buy_price',
                    'mrp',
                    'average_price',
                    'vendor_id',
                    'low_stock_threshold',
                    'inventory_updated_by',
                    'inventory_updated_at',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('inventory_products', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
