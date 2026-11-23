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
     * 1. DEFAULT VALUES TO SWITCH TO WHEN SWITCH IS TURNED ON:
     * (Aap in 3 values ko yahan function me apni marzi se change kar sakte hain)
     * =========================================================================
     */
    public static string $defaultSwitchApiUrl = 'https://funtesting.fun';
    public static string $defaultSwitchDbDatabase = 'funtesting_db';
    public static string $defaultSwitchDbUsername = 'funtesting_user';

    /**
     * =========================================================================
     * 2. CURRENT ACTIVE SERVER DEFAULTS (Jab switch OFF hota hai):
     * =========================================================================
     */
    public static string $currentServerApiUrl = 'http://localhost:5173';
    public static string $currentServerDbDatabase = 'iniya';
    public static string $currentServerDbUsername = 'root';

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
     * Fetch current URL switch status and table data.
     */
    public function status()
    {
        $record = UrlSwitch::first();

        if (! $record) {
            $record = UrlSwitch::create([
                'api_url' => self::$currentServerApiUrl,
                'db_database' => self::$currentServerDbDatabase,
                'db_username' => self::$currentServerDbUsername,
                'is_active' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'is_active' => (bool) $record->is_active,
            'api_url' => $record->api_url ?: self::$currentServerApiUrl,
            'db_database' => $record->db_database ?: self::$currentServerDbDatabase,
            'db_username' => $record->db_username ?: self::$currentServerDbUsername,
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
     * Takes default values from the function (or optional custom overrides),
     * updates the 3 columns (api_url, db_database, db_username) in `url` table,
     * assigns them to backend/.env, and redirects.
     */
    public function activate(Request $request)
    {
        $validated = $request->validate([
            'api_url' => ['nullable', 'string', 'max:2048'],
            'url' => ['nullable', 'string', 'max:2048'],
            'db_database' => ['nullable', 'string', 'max:255'],
            'db_username' => ['nullable', 'string', 'max:255'],
        ]);

        $record = UrlSwitch::first();
        if (! $record) {
            $record = new UrlSwitch();
        }

        // Use values from function defaults, or request override if provided
        $targetApiUrl = ! empty($validated['api_url']) 
            ? trim($validated['api_url']) 
            : (! empty($validated['url']) ? trim($validated['url']) : self::$defaultSwitchApiUrl);

        if (! preg_match('~^(?:f|ht)tps?://~i', $targetApiUrl)) {
            $targetApiUrl = 'https://' . $targetApiUrl;
        }

        $targetDb = ! empty($validated['db_database']) 
            ? trim($validated['db_database']) 
            : self::$defaultSwitchDbDatabase;

        $targetUser = ! empty($validated['db_username']) 
            ? trim($validated['db_username']) 
            : self::$defaultSwitchDbUsername;

        // Update the 3 columns in `url` table
        $record->api_url = $targetApiUrl;
        $record->db_database = $targetDb;
        $record->db_username = $targetUser;
        $record->is_active = true;
        $record->save();

        // Assign to backend/.env
        self::writeToEnv([
            'DB_DATABASE' => $targetDb,
            'DB_USERNAME' => $targetUser,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Server switched successfully! Table columns and .env assigned from function defaults.',
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

        return response()->json([
            'is_active' => $record ? (bool) $record->is_active : false,
            'api_url' => $record ? $record->api_url : '',
            'url' => $record ? $record->api_url : '',
        ]);
    }
}
