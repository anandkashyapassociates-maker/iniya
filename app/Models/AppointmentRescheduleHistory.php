<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentRescheduleHistory extends Model
{
    use HasFactory;

    protected $table = 'appointment_reschedule_history';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'session_id',
        'old_date',
        'old_time',
        'old_staff_id',
        'new_date',
        'new_time',
        'new_staff_id',
        'reschedule_reason',
        'rescheduled_by',
        'created_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'old_date' => 'date:Y-m-d',
            'new_date' => 'date:Y-m-d',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Associated appointment session.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(AppointmentSession::class, 'session_id');
    }

    /**
     * Old assigned staff.
     */
    public function oldStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'old_staff_id');
    }

    /**
     * New assigned staff.
     */
    public function newStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'new_staff_id');
    }
}
