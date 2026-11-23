<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\UrlSwitch;

class UrlSwitchCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'url-switch {action=status : status, on, off, set} {url? : Target URL when action is set}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage server URL switch from the backend (status, on, off, set)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = strtolower($this->argument('action'));
        $record = UrlSwitch::first();

        if (! $record) {
            $record = UrlSwitch::create([
                'url' => 'https://apptesting.fun',
                'is_active' => false,
            ]);
        }

        switch ($action) {
            case 'off':
            case 'disable':
            case 'deactivate':
                $record->is_active = false;
                $record->save();
                $this->info("✅ URL Switch turned OFF. Current target URL: {$record->url}");
                break;

            case 'on':
            case 'enable':
            case 'activate':
                $record->is_active = true;
                $record->save();
                $this->warn("⚠️ URL Switch turned ON. Current target URL: {$record->url}");
                break;

            case 'set':
                $newUrl = $this->argument('url');
                if (! $newUrl) {
                    $newUrl = $this->ask('Enter destination URL:');
                }
                if ($newUrl) {
                    $record->url = $newUrl;
                    $record->save();
                    $this->info("✅ URL updated to: {$record->url}");
                }
                break;

            case 'status':
            default:
                $statusStr = $record->is_active ? 'ON (ACTIVE)' : 'OFF (INACTIVE)';
                $this->line("-----------------------------------------");
                $this->line("URL Switch Status: <fg=" . ($record->is_active ? 'green' : 'yellow') . ">{$statusStr}</>");
                $this->line("Target URL:        {$record->url}");
                $this->line("Updated At:        {$record->updated_at}");
                $this->line("-----------------------------------------");
                break;
        }

        return Command::SUCCESS;
    }
}
