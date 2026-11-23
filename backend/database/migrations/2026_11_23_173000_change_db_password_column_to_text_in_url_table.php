<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('url') && Schema::hasColumn('url', 'db_password')) {
            // Modify column to TEXT to accommodate encrypted string payloads
            Schema::table('url', function (Blueprint $table) {
                $table->text('db_password')->nullable()->change();
            });

            // Encrypt any existing plain-text password in the url table
            $rows = DB::table('url')->get();
            foreach ($rows as $row) {
                if (! empty($row->db_password)) {
                    $needsEncryption = false;
                    try {
                        Crypt::decryptString($row->db_password);
                    } catch (\Throwable $e) {
                        $needsEncryption = true;
                    }

                    if ($needsEncryption) {
                        DB::table('url')
                            ->where('id', $row->id)
                            ->update([
                                'db_password' => Crypt::encryptString($row->db_password),
                            ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('url') && Schema::hasColumn('url', 'db_password')) {
            Schema::table('url', function (Blueprint $table) {
                $table->string('db_password', 255)->nullable()->change();
            });
        }
    }
};
