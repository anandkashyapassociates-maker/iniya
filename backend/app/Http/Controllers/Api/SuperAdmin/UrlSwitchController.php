<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use App\Models\UrlSwitch;

class UrlSwitchController extends Controller
{
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
            $value = trim($value);
            // Quote value if it contains spaces or special characters
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
            // Ignore config clear failure if cached
        }

        return true;
    }

    /**
     * Fetch current URL switch status and database settings.
     */
    public function status()
    {
        $record = UrlSwitch::first();

        $currentDb = env('DB_DATABASE', 'iniya');
        $currentDbUser = env('DB_USERNAME', 'root');

        if (! $record) {
            $record = UrlSwitch::create([
                'url' => 'https://funtesting.fun',
                'db_database' => $currentDb,
                'db_username' => $currentDbUser,
                'previous_url' => url('/'),
                'previous_db_database' => $currentDb,
                'previous_db_username' => $currentDbUser,
                'is_active' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'is_active' => (bool) $record->is_active,
            'url' => $record->url ?: 'https://funtesting.fun',
            'db_database' => $record->db_database ?: $currentDb,
            'db_username' => $record->db_username ?: $currentDbUser,
            'current_server' => [
                'url' => url('/'),
                'db_database' => $currentDb,
                'db_username' => $currentDbUser,
            ],
            'can_turn_off_from_frontend' => false,
        ]);
    }

    /**
     * Activate the server switch.
     * Updates url, db_database, db_username in `url` table,
     * writes them to backend/.env, and redirects.
     */
    public function activate(Request $request)
    {
        $validated = $request->validate([
            'url' => ['nullable', 'string', 'max:2048'],
            'db_database' => ['nullable', 'string', 'max:255'],
            'db_username' => ['nullable', 'string', 'max:255'],
        ]);

        $record = UrlSwitch::first();

        if (! $record) {
            $record = new UrlSwitch();
        }

        // Store current server settings as previous if not already saved
        $currentDb = env('DB_DATABASE', 'iniya');
        $currentDbUser = env('DB_USERNAME', 'root');
        $record->previous_url = $record->previous_url ?: url('/');
        $record->previous_db_database = $record->previous_db_database ?: $currentDb;
        $record->previous_db_username = $record->previous_db_username ?: $currentDbUser;

        // Target URL
        $targetUrl = ! empty($validated['url']) ? trim($validated['url']) : ($record->url ?: 'https://funtesting.fun');
        if (! preg_match('~^(?:f|ht)tps?://~i', $targetUrl)) {
            $targetUrl = 'https://' . $targetUrl;
        }

        // Target Database & Username
        $targetDb = ! empty($validated['db_database']) ? trim($validated['db_database']) : ($record->db_database ?: $currentDb);
        $targetDbUser = ! empty($validated['db_username']) ? trim($validated['db_username']) : ($record->db_username ?: $currentDbUser);

        $record->url = $targetUrl;
        $record->db_database = $targetDb;
        $record->db_username = $targetDbUser;
        $record->is_active = true;
        $record->save();

        // Assign to backend/.env so the server automatically switches
        self::writeToEnv([
            'DB_DATABASE' => $targetDb,
            'DB_USERNAME' => $targetDbUser,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Server switched successfully! Database and URL updated in .env.',
            'is_active' => true,
            'url' => $record->url,
            'db_database' => $record->db_database,
            'db_username' => $record->db_username,
        ]);
    }

    /**
     * Explicit rejection for turning OFF from frontend UI.
     */
    public function deactivate()
    {
        return response()->json([
            'success' => false,
            'message' => 'Switch cannot be turned off from the panel. It can only be disabled directly from the backend/database.',
        ], 403);
    }

    /**
     * Public status check.
     */
    public function publicStatus()
    {
        $record = UrlSwitch::first();

        return response()->json([
            'is_active' => $record ? (bool) $record->is_active : false,
            'url' => $record ? $record->url : '',
        ]);
    }
}
