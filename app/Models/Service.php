<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $table = 'services';

    protected $fillable = [
        'service_category_id',
        'name',
        'description',
        'price',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    /**
     * Sub-category to which this service belongs
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /**
     * Appointment sessions linked to this service
     */
    public function appointmentSessions(): HasMany
    {
        return $this->hasMany(AppointmentSession::class, 'service_id');
    }

    /**
     * Scope for active services
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
