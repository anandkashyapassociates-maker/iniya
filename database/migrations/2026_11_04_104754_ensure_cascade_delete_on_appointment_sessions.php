<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clean up any orphaned appointment session images & records where master_appointment no longer exists
        if (Schema::hasTable('appointment_sessions') && Schema::hasTable('master_appointments')) {
            $orphanedSessions = DB::table('appointment_sessions')
                ->whereNotIn('master_appointment_id', function ($query) {
                    $query->select('id')->from('master_appointments');
                })
                ->get();

            foreach ($orphanedSessions as $ses) {
                if (! empty($ses->image) && Storage::disk('public')->exists($ses->image)) {
                    Storage::disk('public')->delete($ses->image);
                }

                if (Schema::hasTable('appointment_reschedule_history')) {
                    DB::table('appointment_reschedule_history')->where('session_id', $ses->id)->delete();
                }

                DB::table('appointment_sessions')->where('id', $ses->id)->delete();
            }
        }

        // 2. Add ON DELETE CASCADE foreign key constraint to appointment_sessions table
        if (Schema::hasTable('appointment_sessions') && Schema::hasTable('master_appointments')) {
            Schema::table('appointment_sessions', function (Blueprint $table) {
                $table->foreign('master_appointment_id', 'fk_appts_master_id')
                    ->references('id')
                    ->on('master_appointments')
                    ->cascadeOnDelete();
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
                $table->dropForeign('fk_appts_master_id');
            });
        }
    }
};
