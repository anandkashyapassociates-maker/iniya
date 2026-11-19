<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property string $receipt_number
 * @property int $master_appointment_id
 * @property int|null $admin_id
 * @property float $amount
 * @property string $payment_date
 * @property string $payment_mode
 * @property string|null $payment_notes
 * @property float $total_appointment_fees
 * @property float $previous_paid_amount
 * @property float $current_paid_amount
 * @property float $balance_remaining
 * @property array|null $session_allocations
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class AppointmentPayment extends Model
{
    use HasFactory;

    protected $table = 'appointment_payments';

    protected $fillable = [
        'receipt_number',
        'master_appointment_id',
        'admin_id',
        'amount',
        'payment_date',
        'payment_mode',
        'payment_notes',
        'total_appointment_fees',
        'previous_paid_amount',
        'current_paid_amount',
        'balance_remaining',
        'session_allocations',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date:Y-m-d',
            'total_appointment_fees' => 'decimal:2',
            'previous_paid_amount' => 'decimal:2',
            'current_paid_amount' => 'decimal:2',
            'balance_remaining' => 'decimal:2',
            'session_allocations' => 'array',
        ];
    }

    /**
     * Parent master appointment.
     */
    public function masterAppointment(): BelongsTo
    {
        return $this->belongsTo(MasterAppointment::class, 'master_appointment_id');
    }

    /**
     * Admin who collected this payment.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * Generates a unique sequential Receipt Number.
     * Format: RCP-YYYYMMDD-0001
     */
    public static function generateReceiptNumber(?string $date = null): string
    {
        $dateStr = $date ? Carbon::parse($date)->format('Ymd') : Carbon::today()->format('Ymd');
        $prefix = "RCP-{$dateStr}-";

        return DB::transaction(function () use ($prefix) {
            $latest = static::where('receipt_number', 'LIKE', "{$prefix}%")
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(receipt_number, -4) AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latest && preg_match('/-(\d{4})$/', $latest->receipt_number, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            do {
                $candidate = sprintf('%s%04d', $prefix, $nextNumber);
                $exists = static::where('receipt_number', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }
}
