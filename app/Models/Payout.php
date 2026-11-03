<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Payout extends Model
{
    use HasFactory;

    protected $table = 'payouts';

    public const TYPE_STAFF = 'staff';

    public const TYPE_VENDOR = 'vendor';

    public const ACCOUNT_CASH = 'Cash';

    public const ACCOUNT_BANK = 'Bank';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_PENDING = 'pending';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'payout_number',
        'payout_type',
        'staff_id',
        'vendor_id',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'amount',
        'payout_date',
        'account_type',
        'reference_number',
        'note',
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
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'balance_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'payout_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Staff member beneficiary (if payout_type == 'staff').
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    /**
     * Vendor beneficiary (if payout_type == 'vendor').
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    /**
     * Super Admin who created / disbursed the payout.
     */
    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'created_by_superadmin_id');
    }

    /**
     * Safely generate a unique Payout Voucher Number (e.g., PAY-STF-0001, PAY-VEN-0001).
     */
    public static function generateUniqueNumber(string $type = 'staff'): string
    {
        $prefix = ($type === self::TYPE_VENDOR) ? 'PAY-VEN-' : 'PAY-STF-';

        return DB::transaction(function () use ($prefix) {
            $latest = static::where('payout_number', 'LIKE', "{$prefix}%")
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(payout_number, '.(strlen($prefix) + 1).') AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latest && preg_match('/^'.preg_quote($prefix, '/').'(\d+)$/', $latest->payout_number, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            do {
                $candidate = sprintf('%s%04d', $prefix, $nextNumber);
                $exists = static::where('payout_number', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }
}
