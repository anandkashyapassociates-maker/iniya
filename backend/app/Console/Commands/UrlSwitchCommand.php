<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UrlSwitch;
use App\Http\Controllers\Api\SuperAdmin\UrlSwitchController;

class UrlSwitchCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'url-switch {action=status : status, on, off, set} {url? : Target URL} {database? : Target DB_DATABASE} {username? : Target DB_USERNAME}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage server URL and database switch from backend terminal (status, on, off, set)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = strtolower($this->argument('action'));
        $record = UrlSwitch::first();

        $defaultDb = env('DB_DATABASE', 'iniya');
        $defaultUser = env('DB_USERNAME', 'root');

        if (! $record) {
            $record = UrlSwitch::create([
                'url' => 'https://funtesting.fun',
                'db_database' => $defaultDb,
                'db_username' => $defaultUser,
                'previous_url' => url('/'),
                'previous_db_database' => $defaultDb,
                'previous_db_username' => $defaultUser,
                'is_active' => false,
            ]);
        }

        switch ($action) {
            case 'off':
            case 'disable':
            case 'deactivate':
                $record->is_active = false;

                // Revert to original / previous database if available
                $revertDb = $record->previous_db_database ?: 'iniya';
                $revertUser = $record->previous_db_username ?: 'root';

                $record->save();

                // Revert backend/.env values
                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => $revertDb,
                    'DB_USERNAME' => $revertUser,
                ]);

                $this->info("✅ URL Switch turned OFF.");
                $this->line("Restored backend/.env to:");
                $this->line("  DB_DATABASE: {$revertDb}");
                $this->line("  DB_USERNAME: {$revertUser}");
                break;

            case 'on':
            case 'enable':
            case 'activate':
                $record->is_active = true;

                $targetDb = $this->argument('database') ?: ($record->db_database ?: $defaultDb);
                $targetUser = $this->argument('username') ?: ($record->db_username ?: $defaultUser);
                $targetUrl = $this->argument('url') ?: ($record->url ?: 'https://funtesting.fun');

                $record->url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->save();

                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => $targetDb,
                    'DB_USERNAME' => $targetUser,
                ]);

                $this->warn("⚠️ URL Switch turned ON.");
                $this->line("Assigned backend/.env to:");
                $this->line("  Target URL:  {$targetUrl}");
                $this->line("  DB_DATABASE: {$targetDb}");
                $this->line("  DB_USERNAME: {$targetUser}");
                break;

            case 'set':
                $targetUrl = $this->argument('url') ?: $this->ask('Enter target URL:', $record->url ?: 'https://funtesting.fun');
                $targetDb = $this->argument('database') ?: $this->ask('Enter target DB_DATABASE:', $record->db_database ?: $defaultDb);
                $targetUser = $this->argument('username') ?: $this->ask('Enter target DB_USERNAME:', $record->db_username ?: $defaultUser);

                $record->url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->save();

                $this->info("✅ URL Switch parameters updated:");
                $this->line("  URL:         {$targetUrl}");
                $this->line("  DB_DATABASE: {$targetDb}");
                $this->line("  DB_USERNAME: {$targetUser}");
                break;

            case 'status':
            default:
                $statusStr = $record->is_active ? 'ON (ACTIVE)' : 'OFF (INACTIVE)';
                $this->line("--------------------------------------------------");
                $this->line("URL Switch Status: <fg=" . ($record->is_active ? 'green' : 'yellow') . ">{$statusStr}</>");
                $this->line("Target URL:        {$record->url}");
                $this->line("DB_DATABASE:       {$record->db_database}");
                $this->line("DB_USERNAME:       {$record->db_username}");
                $this->line("Current .env DB:   " . env('DB_DATABASE'));
                $this->line("Current .env User: " . env('DB_USERNAME'));
                $this->line("Updated At:        {$record->updated_at}");
                $this->line("--------------------------------------------------");
                break;
        }

        return Command::SUCCESS;
    }
}
