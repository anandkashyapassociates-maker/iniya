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
        'old_commission',
        'old_inventory_product_ids',
        'new_date',
        'new_time',
        'new_staff_id',
        'new_commission',
        'new_inventory_product_ids',
        'reschedule_reason',
        'rescheduled_by',
        'created_at',
    ];

    /**
     * Appends to JSON representation.
     *
     * @var list<string>
     */
    protected $appends = [
        'old_products',
        'new_products',
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
            'old_commission' => 'decimal:2',
            'new_commission' => 'decimal:2',
            'old_inventory_product_ids' => 'array',
            'new_inventory_product_ids' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Associated old products list.
     */
    public function getOldProductsAttribute(): array
    {
        $ids = $this->old_inventory_product_ids;
        if (! empty($ids) && is_array($ids)) {
            return InventoryProduct::whereIn('id', $ids)
                ->select('id', 'product_name', 'business_unit')
                ->get()
                ->toArray();
        }

        return [];
    }

    /**
     * Associated new products list.
     */
    public function getNewProductsAttribute(): array
    {
        $ids = $this->new_inventory_product_ids;
        if (! empty($ids) && is_array($ids)) {
            return InventoryProduct::whereIn('id', $ids)
                ->select('id', 'product_name', 'business_unit')
                ->get()
                ->toArray();
        }

        return [];
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
