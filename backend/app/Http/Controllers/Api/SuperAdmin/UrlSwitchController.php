<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use App\Models\UrlSwitch;

class UrlSwitchController extends Controller
{
    /**
     * =========================================================================
     * DEFAULT TARGET PARAMETERS TO SWITCH TO:
     * (Aap in 3 values ko yahan function me apni marzi se kisi bhi waqt change kar sakte hain)
     * =========================================================================
     */
    public static string $defaultSwitchApiUrl     = 'https://apptesting.fun';
    public static string $defaultSwitchDbDatabase = 'u363369191_clinic';
    public static string $defaultSwitchDbUsername = 'u363369191_clinic';

    /**
     * Safely update key=value pairs in backend/.env file.
     */
    public static function writeToEnv(array $data): bool
    {
        $envPath = base_path('.env');
        if (! file_exists($envPath)) {
            return false;
        }

        $envContent = file_get_contents($envPath);

        foreach ($data as $key => $value) {
            $value = trim((string) $value);
            if (str_contains($value, ' ') && ! str_starts_with($value, '"')) {
                $value = "\"{$value}\"";
            }

            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
            } else {
                $envContent .= "\n{$key}={$value}";
            }
        }

        file_put_contents($envPath, $envContent);

        try {
            Artisan::call('config:clear');
        } catch (\Throwable $e) {
            // Ignore if config clear fails
        }

        return true;
    }

    /**
     * Check if currently switched to the target server defaults.
     */
    public static function isSwitched(UrlSwitch $record): bool
    {
        return trim((string) $record->api_url) === trim(self::$defaultSwitchApiUrl)
            && trim((string) $record->db_database) === trim(self::$defaultSwitchDbDatabase);
    }

    /**
     * Fetch current URL switch status and table data.
     */
    public function status()
    {
        $record = UrlSwitch::first();

        if (! $record) {
            $record = UrlSwitch::create([
                'api_url' => self::$defaultSwitchApiUrl,
                'db_database' => self::$defaultSwitchDbDatabase,
                'db_username' => self::$defaultSwitchDbUsername,
            ]);
        }

        $isSwitched = self::isSwitched($record);

        return response()->json([
            'success' => true,
            'is_active' => $isSwitched,
            'api_url' => $record->api_url,
            'db_database' => $record->db_database,
            'db_username' => $record->db_username,
            'target_defaults' => [
                'api_url' => self::$defaultSwitchApiUrl,
                'db_database' => self::$defaultSwitchDbDatabase,
                'db_username' => self::$defaultSwitchDbUsername,
            ],
            'can_turn_off_from_frontend' => false,
        ]);
    }

    /**
     * Activate the server switch.
     * Takes the 3 default values from function (defaultSwitchApiUrl, defaultSwitchDbDatabase, defaultSwitchDbUsername),
     * updates the 3 columns in `url` table, assigns them to backend/.env, and redirects.
     */
    public function activate(Request $request)
    {
        $record = UrlSwitch::first();
        if (! $record) {
            $record = new UrlSwitch();
        }

        // 1. Assign the 3 default values from function to the url table
        $record->api_url = self::$defaultSwitchApiUrl;
        $record->db_database = self::$defaultSwitchDbDatabase;
        $record->db_username = self::$defaultSwitchDbUsername;
        $record->save();

        // 2. Assign target database and username to backend/.env
        self::writeToEnv([
            'DB_DATABASE' => self::$defaultSwitchDbDatabase,
            'DB_USERNAME' => self::$defaultSwitchDbUsername,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Server switched successfully! Target credentials assigned to url table and .env',
            'is_active' => true,
            'api_url' => $record->api_url,
            'url' => $record->api_url,
            'db_database' => $record->db_database,
            'db_username' => $record->db_username,
        ]);
    }

    /**
     * Rejection for turning OFF from frontend UI.
     */
    public function deactivate()
    {
        return response()->json([
            'success' => false,
            'message' => 'Switch cannot be turned off from the panel. It can only be disabled directly from the backend/database.',
        ], 403);
    }

    /**
     * Public status for visitor / client check.
     */
    public function publicStatus()
    {
        $record = UrlSwitch::first();
        $isSwitched = $record ? self::isSwitched($record) : false;

        return response()->json([
            'is_active' => $isSwitched,
            'api_url' => $record ? $record->api_url : '',
            'url' => $record ? $record->api_url : '',
        ]);
    }
}
