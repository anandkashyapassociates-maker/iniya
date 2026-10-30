<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Staff extends Model
{
    use HasFactory;

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
        'mobile',
        'department',
        'designation',
        'employment_type',
        'joining_date',
        'address',
        'profile_photo',
        'status',
        'is_active',
        'created_by_superadmin_id',
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
     * Appointments assigned to this staff member.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'staff_id');
    }
}
