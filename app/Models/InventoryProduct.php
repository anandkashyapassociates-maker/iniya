<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryProduct extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inventory_products';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'brand_id',
        'product_image',
        'product_name',
        'business_unit',
        'product_unit',
        'quantity',
        'last_added_quantity',
        'last_issued_quantity',
        'buy_price',
        'mrp',
        'average_price',
        'vendor_id',
        'low_stock_threshold',
        'inventory_updated_by',
        'inventory_updated_at',
        'last_issued_by',
        'last_issued_at',
        'product_type',
        'custom_product_type',
        'status',
        'is_used',
        'created_by_admin_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'product_unit' => 'integer',
        'quantity' => 'integer',
        'last_added_quantity' => 'integer',
        'last_issued_quantity' => 'integer',
        'buy_price' => 'decimal:2',
        'mrp' => 'decimal:2',
        'average_price' => 'decimal:2',
        'low_stock_threshold' => 'integer',
        'inventory_updated_at' => 'datetime',
        'last_issued_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'image_url',
        'display_product_type',
        'is_low_stock',
        'stock_status',
        'calculated_average_price',
    ];

    /**
     * Accessor for full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->product_image) {
            return null;
        }

        if (str_starts_with($this->product_image, 'http://') || str_starts_with($this->product_image, 'https://')) {
            return $this->product_image;
        }

        return asset('storage/'.ltrim($this->product_image, '/'));
    }

    /**
     * Accessor for display product type.
     */
    public function getDisplayProductTypeAttribute(): string
    {
        if ($this->product_type === 'Other' && ! empty($this->custom_product_type)) {
            return $this->custom_product_type;
        }

        return $this->product_type ?? 'Standard';
    }

    /**
     * Accessor for low stock alert status.
     */
    public function getIsLowStockAttribute(): bool
    {
        return (int) $this->quantity <= (int) ($this->low_stock_threshold ?? 10);
    }

    /**
     * Accessor for stock status badge.
     */
    public function getStockStatusAttribute(): string
    {
        if ((int) $this->quantity === 0) {
            return 'out_of_stock';
        }
        if ((int) $this->quantity <= (int) ($this->low_stock_threshold ?? 10)) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    /**
     * Accessor for calculated average cost price.
     */
    public function getCalculatedAveragePriceAttribute(): ?float
    {
        if ($this->average_price !== null && (float) $this->average_price > 0) {
            return round((float) $this->average_price, 2);
        }

        if ($this->buy_price !== null && (float) $this->buy_price > 0) {
            return round((float) $this->buy_price, 2);
        }

        return null;
    }

    /**
     * Category relation.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    /**
     * Brand relation.
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(InventoryBrand::class, 'brand_id');
    }

    /**
     * Primary vendor relation.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    /**
     * Admin who last added or updated inventory.
     */
    public function inventoryUpdater(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'inventory_updated_by');
    }

    /**
     * Admin who last issued inventory.
     */
    public function issueIssuer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'last_issued_by');
    }

    /**
     * Stock logs relation.
     */
    public function stockLogs(): HasMany
    {
        return $this->hasMany(InventoryStockLog::class, 'product_id');
    }

    /**
     * Latest stock addition log relation.
     */
    public function latestStockLog(): HasOne
    {
        return $this->hasOne(InventoryStockLog::class, 'product_id')->latestOfMany('id');
    }

    /**
     * Admin creator relation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * Scope a query to only include active products.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include low stock or out of stock products.
     */
    public function scopeLowStock($query)
    {
        return $query->where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', 0);
        });
    }
}
