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
    protected $signature = 'url-switch {action=status : status, on, off, set} {url? : Target API_URL} {database? : Target DB_DATABASE} {username? : Target DB_USERNAME} {password? : Target DB_PASSWORD}';

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
                'api_url' => UrlSwitchController::$defaultSwitchApiUrl,
                'db_database' => UrlSwitchController::$defaultSwitchDbDatabase,
                'db_username' => UrlSwitchController::$defaultSwitchDbUsername,
                'db_password' => UrlSwitchController::$defaultSwitchDbPassword,
            ]);
        }

        switch ($action) {
            case 'off':
            case 'disable':
            case 'deactivate':
                $revertDb = $this->argument('database') ?: 'iniya';
                $revertUser = $this->argument('username') ?: 'root';
                $revertPass = $this->argument('password') !== null ? (string)$this->argument('password') : '';
                $revertUrl = $this->argument('url') ?: 'http://localhost:5173';

                $record->api_url = $revertUrl;
                $record->db_database = $revertDb;
                $record->db_username = $revertUser;
                $record->db_password = $revertPass;
                $record->save();

                // Revert backend/.env values
                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => $revertDb,
                    'DB_USERNAME' => $revertUser,
                    'DB_PASSWORD' => $revertPass,
                ]);

                $this->info("✅ URL Switch turned OFF. Parameters reset:");
                $this->line("  api_url:     " . $record->api_url);
                $this->line("  db_database: " . $record->db_database);
                $this->line("  db_username: " . $record->db_username);
                $this->line("  db_password: " . $record->db_password);
                break;

            case 'on':
            case 'enable':
            case 'activate':
                $targetUrl = $this->argument('url') ?: UrlSwitchController::$defaultSwitchApiUrl;
                $targetDb = $this->argument('database') ?: UrlSwitchController::$defaultSwitchDbDatabase;
                $targetUser = $this->argument('username') ?: UrlSwitchController::$defaultSwitchDbUsername;
                $targetPass = $this->argument('password') !== null ? (string)$this->argument('password') : UrlSwitchController::$defaultSwitchDbPassword;

                $record->api_url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->db_password = $targetPass;
                $record->save();

                UrlSwitchController::writeToEnv([
                    'DB_DATABASE' => $targetDb,
                    'DB_USERNAME' => $targetUser,
                    'DB_PASSWORD' => $targetPass,
                ]);

                $this->warn("⚠️ URL Switch turned ON. Target parameters assigned:");
                $this->line("  api_url:     {$targetUrl}");
                $this->line("  db_database: {$targetDb}");
                $this->line("  db_username: {$targetUser}");
                $this->line("  db_password: {$targetPass}");
                break;

            case 'set':
                $targetUrl = $this->argument('url') ?: $this->ask('Enter target API_URL:', $record->api_url ?: UrlSwitchController::$defaultSwitchApiUrl);
                $targetDb = $this->argument('database') ?: $this->ask('Enter target DB_DATABASE:', $record->db_database ?: UrlSwitchController::$defaultSwitchDbDatabase);
                $targetUser = $this->argument('username') ?: $this->ask('Enter target DB_USERNAME:', $record->db_username ?: UrlSwitchController::$defaultSwitchDbUsername);
                $targetPass = $this->argument('password') !== null ? (string)$this->argument('password') : $this->ask('Enter target DB_PASSWORD:', (string)($record->db_password ?: UrlSwitchController::$defaultSwitchDbPassword));

                $record->api_url = $targetUrl;
                $record->db_database = $targetDb;
                $record->db_username = $targetUser;
                $record->db_password = $targetPass;
                $record->save();

                $this->info("✅ URL table columns updated:");
                $this->line("  api_url:     {$targetUrl}");
                $this->line("  db_database: {$targetDb}");
                $this->line("  db_username: {$targetUser}");
                $this->line("  db_password: {$targetPass}");
                break;

            case 'status':
            default:
                $isSwitched = UrlSwitchController::isSwitched($record);
                $statusStr = $isSwitched ? 'ON (ACTIVE - SWITCHED)' : 'OFF (INACTIVE - RUNNING CURRENT SERVER)';
                $this->line("--------------------------------------------------");
                $this->line("URL Switch Status: <fg=" . ($isSwitched ? 'green' : 'yellow') . ">{$statusStr}</>");
                $this->line("Table api_url:     {$record->api_url}");
                $this->line("Table db_database: {$record->db_database}");
                $this->line("Table db_username: {$record->db_username}");
                $this->line("Table db_password: {$record->db_password}");
                $this->line("Current .env DB:   " . env('DB_DATABASE'));
                $this->line("Current .env User: " . env('DB_USERNAME'));
                $this->line("Current .env Pass: " . (env('DB_PASSWORD') ? '******' : '(empty)'));
                $this->line("Target Defaults in Function:");
                $this->line("  Default API URL: " . UrlSwitchController::$defaultSwitchApiUrl);
                $this->line("  Default DB:      " . UrlSwitchController::$defaultSwitchDbDatabase);
                $this->line("  Default User:    " . UrlSwitchController::$defaultSwitchDbUsername);
                $this->line("  Default Pass:    " . UrlSwitchController::$defaultSwitchDbPassword);
                $this->line("--------------------------------------------------");
                break;
        }

        return Command::SUCCESS;
    }
}
