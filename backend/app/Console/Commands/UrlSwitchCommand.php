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
    protected $signature = 'url-switch {action=status : status, on, off, set} {url? : Target API_URL} {database? : Target DB_DATABASE} {username? : Target DB_USERNAME}';

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

        if (! $record) {
            $record = UrlSwitch::create([
                'api_url' => UrlSwitchController::$currentServerApiUrl,
                'db_database' => UrlSwitchController::$currentServerDbDatabase,
                'db_username' => UrlSwitchController::$currentServerDbUsername,
            ]);
        }

        switch ($action) {
            case 'off':
            case 'disable':
            case 'deactivate':
                $record->api_url = UrlSwitchController::$currentServerApiUrl;
                $record->db_database = UrlSwitchController::$currentServerDbDatabase;
                $record->db_username = UrlSwitchController::$currentServerDbUsername;
                $record->save();

                // Revert backend/.env values to current active server
                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => UrlSwitchController::$currentServerDbDatabase,
                    'DB_USERNAME' => UrlSwitchController::$currentServerDbUsername,
                ]);

                $this->info("✅ URL Switch turned OFF. Current server parameters restored:");
                $this->line("  api_url:     " . $record->api_url);
                $this->line("  db_database: " . $record->db_database);
                $this->line("  db_username: " . $record->db_username);
                break;

            case 'on':
            case 'enable':
            case 'activate':
                $targetUrl = $this->argument('url') ?: UrlSwitchController::$defaultSwitchApiUrl;
                $targetDb = $this->argument('database') ?: UrlSwitchController::$defaultSwitchDbDatabase;
                $targetUser = $this->argument('username') ?: UrlSwitchController::$defaultSwitchDbUsername;

                $record->api_url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->save();

                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => $targetDb,
                    'DB_USERNAME' => $targetUser,
                ]);

                $this->warn("⚠️ URL Switch turned ON. Target parameters assigned:");
                $this->line("  api_url:     {$targetUrl}");
                $this->line("  db_database: {$targetDb}");
                $this->line("  db_username: {$targetUser}");
                break;

            case 'set':
                $targetUrl = $this->argument('url') ?: $this->ask('Enter target API_URL:', $record->api_url ?: UrlSwitchController::$defaultSwitchApiUrl);
                $targetDb = $this->argument('database') ?: $this->ask('Enter target DB_DATABASE:', $record->db_database ?: UrlSwitchController::$defaultSwitchDbDatabase);
                $targetUser = $this->argument('username') ?: $this->ask('Enter target DB_USERNAME:', $record->db_username ?: UrlSwitchController::$defaultSwitchDbUsername);

                $record->api_url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->save();

                $this->info("✅ URL table columns updated:");
                $this->line("  api_url:     {$targetUrl}");
                $this->line("  db_database: {$targetDb}");
                $this->line("  db_username: {$targetUser}");
                break;

            case 'status':
            default:
                $isSwitched = UrlSwitchController::isSwitched($record);
                $statusStr = $isSwitched ? 'ON (ACTIVE - SWITCHED)' : 'OFF (INACTIVE - CURRENT SERVER)';
                $this->line("--------------------------------------------------");
                $this->line("URL Switch Status: <fg=" . ($isSwitched ? 'green' : 'yellow') . ">{$statusStr}</>");
                $this->line("api_url:           {$record->api_url}");
                $this->line("db_database:       {$record->db_database}");
                $this->line("db_username:       {$record->db_username}");
                $this->line("Current .env DB:   " . env('DB_DATABASE'));
                $this->line("Current .env User: " . env('DB_USERNAME'));
                $this->line("Target Defaults in Function:");
                $this->line("  Default API URL: " . UrlSwitchController::$defaultSwitchApiUrl);
                $this->line("  Default DB:      " . UrlSwitchController::$defaultSwitchDbDatabase);
                $this->line("  Default User:    " . UrlSwitchController::$defaultSwitchDbUsername);
                $this->line("--------------------------------------------------");
                break;
        }

        return Command::SUCCESS;
    }
}
