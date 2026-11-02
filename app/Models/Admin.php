<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'admins';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_BLOCKED = 'blocked';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'super_admin_id',
        'name',
        'email',
        'mobile',
        'status',
        'password',
        'is_active',
        'email_verified_at',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Admin $admin) {
            if ($admin->isDirty('status') && ! $admin->isDirty('is_active')) {
                $admin->is_active = ($admin->status === self::STATUS_ACTIVE);
            } elseif ($admin->isDirty('is_active') && ! $admin->isDirty('status')) {
                if (! $admin->is_active && ($admin->status === null || $admin->status === self::STATUS_ACTIVE)) {
                    $admin->status = self::STATUS_INACTIVE;
                } elseif ($admin->is_active && $admin->status !== self::STATUS_ACTIVE) {
                    $admin->status = self::STATUS_ACTIVE;
                }
            } elseif (! isset($admin->status)) {
                $admin->status = $admin->is_active ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
            }
        });
    }

    /**
     * Get the super admin that created this admin.
     */
    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'super_admin_id');
    }

    /**
     * Get the customers created by this admin.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'admin_id');
    }

    /**
     * Get the categories created by this admin.
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'admin_id');
    }

    /**
     * Get inventory products created by this admin.
     */
    public function inventoryProducts(): HasMany
    {
        return $this->hasMany(InventoryProduct::class, 'created_by_admin_id');
    }

    /**
     * Get inventory categories created by this admin.
     */
    public function inventoryCategories(): HasMany
    {
        return $this->hasMany(InventoryCategory::class, 'created_by');
    }

    /**
     * Get inventory brands created by this admin.
     */
    public function inventoryBrands(): HasMany
    {
        return $this->hasMany(InventoryBrand::class, 'created_by');
    }
}
