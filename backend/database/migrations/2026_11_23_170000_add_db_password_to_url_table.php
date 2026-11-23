<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('url') && ! Schema::hasColumn('url', 'db_password')) {
            Schema::table('url', function (Blueprint $table) {
                $table->string('db_password', 255)->nullable()->after('db_username');
            });

            // Set current server default password if null
            DB::table('url')->whereNull('db_password')->update([
                'db_password' => env('DB_PASSWORD', ''),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('url') && Schema::hasColumn('url', 'db_password')) {
            Schema::table('url', function (Blueprint $table) {
                $table->dropColumn('db_password');
            });
        }
    }
};
