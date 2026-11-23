<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UrlSwitch;

class UrlSwitchController extends Controller
{
    /**
     * Fetch current URL switch status.
     */
    public function status()
    {
        $record = UrlSwitch::first();

        if (! $record) {
            $record = UrlSwitch::create([
                'url' => 'https://apptesting.fun',
                'is_active' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'is_active' => (bool) $record->is_active,
            'url' => $record->url,
            'can_turn_off_from_frontend' => false,
        ]);
    }

    /**
     * Activate the URL switch.
     * Once switched ON, it turns on and redirects to the configured URL.
     */
    public function activate(Request $request)
    {
        $validated = $request->validate([
            'url' => ['nullable', 'string', 'max:2048'],
        ]);

        $record = UrlSwitch::first();

        if (! $record) {
            $record = new UrlSwitch();
        }

        if (! empty($validated['url'])) {
            $targetUrl = trim($validated['url']);
            // Ensure http:// or https:// prefix
            if (! preg_match('~^(?:f|ht)tps?://~i', $targetUrl)) {
                $targetUrl = 'https://' . $targetUrl;
            }
            $record->url = $targetUrl;
        } elseif (empty($record->url)) {
            $record->url = 'https://apptesting.fun';
        }

        $record->is_active = true;
        $record->save();

        return response()->json([
            'success' => true,
            'message' => 'Server URL switch has been activated. Redirecting to destination...',
            'is_active' => true,
            'url' => $record->url,
        ]);
    }

    /**
     * Explicit rejection for turning OFF from the frontend UI.
     * The switch can only be disabled from the backend/database.
     */
    public function deactivate()
    {
        return response()->json([
            'success' => false,
            'message' => 'Switch cannot be turned off from the panel. It can only be disabled directly from the backend/database.',
        ], 403);
    }

    /**
     * Public status for visitor / client redirect check (if enabled).
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
