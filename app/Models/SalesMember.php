<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class SalesMember extends Model
{
    use HasFactory;

    protected $table = 'sales_members';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_BLOCKED = 'blocked';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sales_code',
        'name',
        'email',
        'mobile',
        'alternate_mobile',
        'gender',
        'profile_photo',
        'designation',
        'department',
        'employment_type',
        'joining_date',
        'territory',
        'city',
        'state',
        'country',
        'address',
        'notes',
        'status',
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
            'joining_date' => 'date',
        ];
    }

    /**
     * Model booted event handlers for sanitization and normalization.
     */
    protected static function booted(): void
    {
        static::saving(function (SalesMember $member) {
            // Normalize email
            if ($member->email) {
                $member->email = strtolower(trim($member->email));
            }

            // Normalize nullable string fields: convert empty strings to null
            $nullableFields = [
                'alternate_mobile',
                'gender',
                'profile_photo',
                'designation',
                'department',
                'employment_type',
                'joining_date',
                'territory',
                'city',
                'state',
                'country',
                'address',
                'notes',
            ];

            foreach ($nullableFields as $field) {
                if (isset($member->{$field}) && trim((string) $member->{$field}) === '') {
                    $member->{$field} = null;
                } elseif (isset($member->{$field}) && is_string($member->{$field})) {
                    $member->{$field} = trim($member->{$field});
                }
            }

            // Ensure status default
            if (empty($member->status)) {
                $member->status = self::STATUS_ACTIVE;
            }
        });
    }

    /**
     * Safely generate a unique Sales Code (e.g. SAL-0001, SAL-0002).
     */
    public static function generateUniqueCode(): string
    {
        return DB::transaction(function () {
            // Find the highest existing SAL number using row lock for concurrency safety
            $latestMember = static::where('sales_code', 'LIKE', 'SAL-%')
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(sales_code, 5) AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latestMember && preg_match('/^SAL-(\d+)$/', $latestMember->sales_code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            // Ensure uniqueness with collision protection loop
            do {
                $candidate = sprintf('SAL-%04d', $nextNumber);
                $exists = static::where('sales_code', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }

    /**
     * Super Admin who created this sales team member.
     */
    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'created_by_superadmin_id');
    }
}

