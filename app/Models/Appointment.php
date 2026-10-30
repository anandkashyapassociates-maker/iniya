<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'appointments';

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const SLOT_MORNING = 'Morning';

    public const SLOT_AFTERNOON = 'Afternoon';

    public const SLOT_EVENING = 'Evening';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'appointment_number',
        'customer_id',
        'staff_id',
        'admin_id',
        'appointment_date',
        'appointment_time',
        'session_slot',
        'session_number',
        'total_sessions',
        'treatment_name',
        'treatment_details',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'rescheduled_reason',
        'previous_appointment_date',
        'previous_appointment_time',
        'previous_session_slot',
        'rescheduled_at',
        'fee',
        'payment_status',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d',
            'previous_appointment_date' => 'date:Y-m-d',
            'cancelled_at' => 'datetime',
            'rescheduled_at' => 'datetime',
            'session_number' => 'integer',
            'total_sessions' => 'integer',
            'fee' => 'decimal:2',
        ];
    }

    /**
     * Generate a unique sequential appointment number.
     */
    public static function generateAppointmentNumber(): string
    {
        $prefix = 'APT-'.date('Ymd').'-';
        $latest = static::where('appointment_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->value('appointment_number');

        if ($latest && preg_match('/-(\d+)$/', $latest, $matches)) {
            $nextSequence = (int) $matches[1] + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix.str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * The customer / patient for this appointment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * The assigned staff member for this appointment.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    /**
     * The admin who booked or manages this appointment.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }
}
