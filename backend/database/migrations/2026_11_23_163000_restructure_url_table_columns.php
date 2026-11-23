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
        if (Schema::hasTable('url')) {
            Schema::table('url', function (Blueprint $table) {
                // Drop previous columns if they exist
                $colsToDrop = ['previous_url', 'previous_db_database', 'previous_db_username'];
                foreach ($colsToDrop as $col) {
                    if (Schema::hasColumn('url', $col)) {
                        $table->dropColumn($col);
                    }
                }

                // Rename or add api_url
                if (! Schema::hasColumn('url', 'api_url')) {
                    if (Schema::hasColumn('url', 'url')) {
                        $table->renameColumn('url', 'api_url');
                    } else {
                        $table->text('api_url')->after('id');
                    }
                }

                if (! Schema::hasColumn('url', 'db_database')) {
                    $table->string('db_database', 255)->nullable()->after('api_url');
                }

                if (! Schema::hasColumn('url', 'db_username')) {
                    $table->string('db_username', 255)->nullable()->after('db_database');
                }
            });

            // Ensure current active server defaults in the table
            DB::table('url')->truncate();
            DB::table('url')->insert([
                'id' => 1,
                'api_url' => 'http://localhost:5173',
                'db_database' => env('DB_DATABASE', 'iniya'),
                'db_username' => env('DB_USERNAME', 'root'),
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('url')) {
            Schema::table('url', function (Blueprint $table) {
                if (Schema::hasColumn('url', 'api_url') && ! Schema::hasColumn('url', 'url')) {
                    $table->renameColumn('api_url', 'url');
                }
            });
        }
    }
};
