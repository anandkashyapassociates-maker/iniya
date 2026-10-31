<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
        'product_type',
        'custom_product_type',
        'status',
        'is_used',
        'created_by_admin_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_used' => 'boolean',
            'product_unit' => 'integer',
        ];
    }

    /**
     * Appointment sessions that use this product.
     */
    public function appointmentSessions(): HasMany
    {
        return $this->hasMany(AppointmentSession::class, 'inventory_product_id');
    }
}
