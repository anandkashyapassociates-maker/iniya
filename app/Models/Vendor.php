<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Vendor extends Model
{
    use HasFactory;

    protected $table = 'vendors';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_BLOCKED = 'blocked';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'vendor_code',
        'vendor_name',
        'company_name',
        'email',
        'mobile',
        'alternate_mobile',
        'vendor_type',
        'gst_number',
        'pan_number',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'contact_person',
        'notes',
        'status',
        'created_by_superadmin_id',
    ];

    /**
     * Model booted event handlers for sanitization and normalization.
     */
    protected static function booted(): void
    {
        static::saving(function (Vendor $vendor) {
            // Normalize email
            if ($vendor->email) {
                $vendor->email = strtolower(trim($vendor->email));
            }

            // Normalize nullable string fields: convert empty strings to null
            $nullableFields = [
                'company_name',
                'alternate_mobile',
                'vendor_type',
                'gst_number',
                'pan_number',
                'address',
                'city',
                'state',
                'postal_code',
                'country',
                'contact_person',
                'notes',
            ];

            foreach ($nullableFields as $field) {
                if (isset($vendor->{$field}) && trim((string) $vendor->{$field}) === '') {
                    $vendor->{$field} = null;
                } elseif (isset($vendor->{$field}) && is_string($vendor->{$field})) {
                    $vendor->{$field} = trim($vendor->{$field});
                }
            }

            // Ensure status default
            if (empty($vendor->status)) {
                $vendor->status = self::STATUS_ACTIVE;
            }
        });
    }

    /**
     * Safely generate a unique Vendor Code (e.g. VEN-0001, VEN-0002).
     */
    public static function generateUniqueCode(): string
    {
        return DB::transaction(function () {
            // Find the highest existing VEN number using row lock for concurrency safety
            $latestVendor = static::where('vendor_code', 'LIKE', 'VEN-%')
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(vendor_code, 5) AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latestVendor && preg_match('/^VEN-(\d+)$/', $latestVendor->vendor_code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            // Ensure uniqueness
            do {
                $candidate = sprintf('VEN-%04d', $nextNumber);
                $exists = static::where('vendor_code', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }

    /**
     * Super Admin who created this vendor.
     */
    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'created_by_superadmin_id');
    }
}

