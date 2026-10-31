<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    use HasFactory;

    protected $table = 'service_categories';

    protected $fillable = [
        'parent_id',
        'name',
        'description',
        'type',
        'status',
    ];

    /**
     * Parent category (for sub_category records)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Direct sub-categories (for category records)
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Services directly belonging to this sub-category
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'service_category_id');
    }

    /**
     * Scope for main categories only
     */
    public function scopeCategories($query)
    {
        return $query->where('type', 'category')->whereNull('parent_id');
    }

    /**
     * Scope for sub-categories only
     */
    public function scopeSubCategories($query)
    {
        return $query->where('type', 'sub_category')->whereNotNull('parent_id');
    }

    /**
     * Scope for active records
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
