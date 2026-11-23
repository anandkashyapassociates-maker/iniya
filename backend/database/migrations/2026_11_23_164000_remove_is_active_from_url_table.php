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
        if (Schema::hasTable('url') && Schema::hasColumn('url', 'is_active')) {
            Schema::table('url', function (Blueprint $table) {
                // Drop index if exists, then drop column
                $table->dropColumn('is_active');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('url') && ! Schema::hasColumn('url', 'is_active')) {
            Schema::table('url', function (Blueprint $table) {
                $table->boolean('is_active')->default(false);
            });
        }
    }
};
