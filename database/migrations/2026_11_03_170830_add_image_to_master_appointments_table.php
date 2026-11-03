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
        Schema::table('master_appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('master_appointments', 'image')) {
                $table->string('image', 500)->nullable()->after('notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_appointments', function (Blueprint $table) {
            if (Schema::hasColumn('master_appointments', 'image')) {
                $table->dropColumn('image');
            }
        });
    }
};
