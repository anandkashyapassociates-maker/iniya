<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'product_type',
        'custom_product_type',
        'status',
        'created_by_admin_id',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'image_url',
        'display_product_type',
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
}

