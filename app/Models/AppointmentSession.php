<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppointmentSession extends Model
{
    use HasFactory;

    protected $table = 'appointment_sessions';

    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * All allowed statuses.
     *
     * @var list<string>
     */
    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'master_appointment_id',
        'session_number',
        'service_id',
        'treatment_details',
        'session_date',
        'session_time',
        'staff_id',
        'staff_commission',
        'inventory_product_id',
        'inventory_product_ids',
        'status',
    ];

    protected $appends = [
        'selected_products',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session_number' => 'integer',
            'session_date' => 'date:Y-m-d',
            'staff_commission' => 'decimal:2',
            'inventory_product_ids' => 'array',
        ];
    }

    /**
     * Accessor to return multiple selected inventory product records.
     */
    public function getSelectedProductsAttribute(): array
    {
        $ids = $this->inventory_product_ids;
        if (! empty($ids) && is_array($ids)) {
            return InventoryProduct::whereIn('id', $ids)
                ->select('id', 'product_name', 'business_unit')
                ->get()
                ->toArray();
        }

        if ($this->inventory_product_id) {
            $p = $this->inventoryProduct;

            return $p ? [$p->only(['id', 'product_name', 'business_unit'])] : [];
        }

        return [];
    }

    /**
     * Check if this session can be rescheduled.
     * Only pending sessions are eligible for reschedule.
     */
    public function canBeRescheduled(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Parent master appointment.
     */
    public function masterAppointment(): BelongsTo
    {
        return $this->belongsTo(MasterAppointment::class, 'master_appointment_id');
    }

    /**
     * Assigned staff member.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    /**
     * Selected inventory product.
     */
    public function inventoryProduct(): BelongsTo
    {
        return $this->belongsTo(InventoryProduct::class, 'inventory_product_id');
    }

    /**
     * Selected clinical service.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    /**
     * Reschedule history records.
     */
    public function rescheduleHistories(): HasMany
    {
        return $this->hasMany(AppointmentRescheduleHistory::class, 'session_id')->orderByDesc('id');
    }
}
