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
     * (Aap in 4 values ko yahan function me apni marzi se kisi bhi waqt change kar sakte hain)
     * =========================================================================
     */
    public static string $defaultSwitchApiUrl     = 'https://apptesting.fun';
    public static string $defaultSwitchDbDatabase = 'u363369191_clinic';
    public static string $defaultSwitchDbUsername = 'u363369191_clinic';
    public static string $defaultSwitchDbPassword = 'u363369191_cliniC';

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

        // Safely remove config cache file if it exists, without triggering DB reconnects inside request
        $configCache = base_path('bootstrap/cache/config.php');
        if (file_exists($configCache)) {
            @unlink($configCache);
        }

        return true;
    }

    /**
     * Check if existing database `url` table columns match function default parameters:
     * (defaultSwitchApiUrl, defaultSwitchDbDatabase, defaultSwitchDbUsername)
     *  - Agar existing database me `url` table ke columns function defaults se match hote hain: HIDE (return true)
     *  - Baaki iske alawa jo bhi server or database match nahi hote hain: SHOW (return false)
     */
    public static function isSwitched(?UrlSwitch $record = null): bool
    {
        if (! $record) {
            $record = UrlSwitch::first();
        }

        if (! $record) {
            return false;
        }

        $urlMatches  = trim((string) $record->api_url) === trim(self::$defaultSwitchApiUrl);
        $dbMatches   = trim((string) $record->db_database) === trim(self::$defaultSwitchDbDatabase);
        $userMatches = trim((string) $record->db_username) === trim(self::$defaultSwitchDbUsername);

        return $urlMatches && $dbMatches && $userMatches;
    }

    /**
     * Fetch current URL switch status and table data.
     */
    public function status()
    {
        $record = UrlSwitch::first();

        $isSwitched = $record ? self::isSwitched($record) : false;

        return response()->json([
            'success' => true,
            'is_active' => $isSwitched,
            'api_url' => $record ? $record->api_url : '',
            'db_database' => $record ? $record->db_database : '',
            'db_username' => $record ? $record->db_username : '',
            'db_password' => $record ? $record->db_password : '',
            'target_defaults' => [
                'api_url' => self::$defaultSwitchApiUrl,
                'db_database' => self::$defaultSwitchDbDatabase,
                'db_username' => self::$defaultSwitchDbUsername,
                'db_password' => self::$defaultSwitchDbPassword,
            ],
            'can_turn_off_from_frontend' => false,
        ]);
    }

    /**
     * Activate the server switch.
     * Takes the 4 default values from function (defaultSwitchApiUrl, defaultSwitchDbDatabase, defaultSwitchDbUsername, defaultSwitchDbPassword),
     * updates the 4 columns in `url` table, assigns them to backend/.env, and redirects.
     */
    public function activate(Request $request)
    {
        $redirectUrl = self::$defaultSwitchApiUrl;

        try {
            $record = UrlSwitch::first();
            if (! $record) {
                $record = new UrlSwitch();
            }

            // 1. Assign the 4 default values from function to the url table
            $record->api_url = self::$defaultSwitchApiUrl;
            $record->db_database = self::$defaultSwitchDbDatabase;
            $record->db_username = self::$defaultSwitchDbUsername;
            $record->db_password = self::$defaultSwitchDbPassword;
            $record->save();
        } catch (\Throwable $e) {
            // Log table save exception but proceed so .env and redirect occur
        }

        // 2. Assign target database, username and decrypted password to backend/.env
        // ($record->db_password accessor automatically decrypts it for .env)
        self::writeToEnv([
            'DB_DATABASE' => self::$defaultSwitchDbDatabase,
            'DB_USERNAME' => self::$defaultSwitchDbUsername,
            'DB_PASSWORD' => $record->db_password ?: self::$defaultSwitchDbPassword,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Server switched successfully! Target credentials assigned to url table and .env',
            'is_active' => true,
            'api_url' => $redirectUrl,
            'url' => $redirectUrl,
            'db_database' => self::$defaultSwitchDbDatabase,
            'db_username' => self::$defaultSwitchDbUsername,
            'db_password' => self::$defaultSwitchDbPassword,
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
