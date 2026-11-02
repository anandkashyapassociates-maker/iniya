<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStockLog extends Model
{
    use HasFactory;

    protected $table = 'inventory_stock_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'vendor_id',
        'admin_id',
        'quantity',
        'business_unit',
        'buy_price',
        'mrp',
        'average_price',
        'type',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'buy_price' => 'decimal:2',
        'mrp' => 'decimal:2',
        'average_price' => 'decimal:2',
    ];

    /**
     * Product relation.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }

    /**
     * Vendor relation.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    /**
     * Admin relation.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }
}
