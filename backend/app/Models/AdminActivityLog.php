<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AdminActivityLog extends Model
{
    protected $table = 'admin_activity_logs';

    protected $fillable = [
        'actor_type',
        'actor_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
    ];

    /**
     * Helper to log an activity.
     */
    public static function record(
        string $actorType,
        int $actorId,
        string $action,
        string $description,
        ?Request $request = null
    ): self {
        return self::create([
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'action' => $action,
            'description' => $description,
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 500) : null,
        ]);
    }
}

