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
        if (! Schema::hasTable('url')) {
            Schema::create('url', function (Blueprint $table) {
                $table->id();
                $table->text('url');
                $table->boolean('is_active')->default(false)->index();
                $table->timestamps();
            });

            // Insert initial default record
            DB::table('url')->insert([
                'url' => 'https://apptesting.fun',
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
        Schema::dropIfExists('url');
    }
};
