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
                if (! Schema::hasColumn('url', 'db_database')) {
                    $table->string('db_database', 255)->nullable()->after('url');
                }
                if (! Schema::hasColumn('url', 'db_username')) {
                    $table->string('db_username', 255)->nullable()->after('db_database');
                }
                if (! Schema::hasColumn('url', 'previous_url')) {
                    $table->text('previous_url')->nullable()->after('db_username');
                }
                if (! Schema::hasColumn('url', 'previous_db_database')) {
                    $table->string('previous_db_database', 255)->nullable()->after('previous_url');
                }
                if (! Schema::hasColumn('url', 'previous_db_username')) {
                    $table->string('previous_db_username', 255)->nullable()->after('previous_db_database');
                }
            });

            $currentDb = env('DB_DATABASE', 'iniya');
            $currentDbUser = env('DB_USERNAME', 'root');
            DB::table('url')->whereNull('db_database')->update([
                'db_database' => $currentDb,
                'db_username' => $currentDbUser,
                'previous_db_database' => $currentDb,
                'previous_db_username' => $currentDbUser,
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
                $cols = ['db_database', 'db_username', 'previous_url', 'previous_db_database', 'previous_db_username'];
                foreach ($cols as $c) {
                    if (Schema::hasColumn('url', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
    }
};
