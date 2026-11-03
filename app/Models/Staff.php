<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class Staff extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'staff';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_BLOCKED = 'blocked';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'staff_code',
        'name',
        'email',
        'password',
        'mobile',
        'department',
        'designation',
        'employment_type',
        'joining_date',
        'address',
        'profile_photo',
        'status',
        'is_active',
        'last_login_at',
        'created_by_superadmin_id',
    ];

    /**
     * Appended attributes.
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * Accessor for full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        $photo = $this->profile_photo;
        if (! $photo) {
            return null;
        }

        if (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
            return $photo;
        }

        return asset('storage/'.ltrim($photo, '/'));
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joining_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Model booted event handlers.
     */
    protected static function booted(): void
    {
        static::saving(function (Staff $staff) {
            // Keep status and is_active in sync
            if ($staff->isDirty('status') && ! $staff->isDirty('is_active')) {
                $staff->is_active = ($staff->status === self::STATUS_ACTIVE);
            } elseif ($staff->isDirty('is_active') && ! $staff->isDirty('status')) {
                if (! $staff->is_active && ($staff->status === null || $staff->status === self::STATUS_ACTIVE)) {
                    $staff->status = self::STATUS_INACTIVE;
                } elseif ($staff->is_active && $staff->status !== self::STATUS_ACTIVE) {
                    $staff->status = self::STATUS_ACTIVE;
                }
            } elseif (! isset($staff->status)) {
                $staff->status = $staff->is_active ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
            }
        });
    }

    /**
     * Safely generate a unique Staff Code (e.g. STF-0001, STF-0002).
     */
    public static function generateUniqueCode(): string
    {
        return DB::transaction(function () {
            // Find the highest existing STF number using row lock for concurrency safety
            $latestStaff = static::where('staff_code', 'LIKE', 'STF-%')
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(staff_code, 5) AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latestStaff && preg_match('/^STF-(\d+)$/', $latestStaff->staff_code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            // Ensure uniqueness
            do {
                $candidate = sprintf('STF-%04d', $nextNumber);
                $exists = static::where('staff_code', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }

    /**
     * Super Admin who created this staff member.
     */
    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'created_by_superadmin_id');
    }

    /**
     * Appointment sessions assigned to this staff member.
     */
    public function appointmentSessions(): HasMany
    {
        return $this->hasMany(AppointmentSession::class, 'staff_id');
    }

    /**
     * Payout records disbursed to this staff member.
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'staff_id');
    }
}
