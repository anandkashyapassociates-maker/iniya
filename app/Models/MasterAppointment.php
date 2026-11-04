<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MasterAppointment extends Model
{
    use HasFactory;

    protected $table = 'master_appointments';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'appointment_number',
        'customer_id',
        'appointment_date',
        'sales_team_id',
        'appointment_fees',
        'notes',
        'image',
        'admin_id',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::deleting(function (MasterAppointment $master) {
            if ($master->image && Storage::disk('public')->exists($master->image)) {
                Storage::disk('public')->delete($master->image);
            }

            // Ensure child sessions and their files & reschedule logs are cleaned up
            foreach ($master->sessions()->get() as $session) {
                $session->delete();
            }
        });
    }

    /**
     * Accessor for full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
            return $this->image;
        }

        return asset('storage/'.ltrim($this->image, '/'));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d',
            'appointment_fees' => 'decimal:2',
        ];
    }

    /**
     * Generates a unique sequential Master Appointment Number.
     * Format: MAPT-YYYYMMDD-0001
     */
    public static function generateUniqueNumber(?string $date = null): string
    {
        $dateStr = $date ? Carbon::parse($date)->format('Ymd') : Carbon::today()->format('Ymd');
        $prefix = "MAPT-{$dateStr}-";

        return DB::transaction(function () use ($prefix) {
            $latest = static::where('appointment_number', 'LIKE', "{$prefix}%")
                ->lockForUpdate()
                ->orderByRaw('CAST(SUBSTRING(appointment_number, -4) AS UNSIGNED) DESC')
                ->first();

            $nextNumber = 1;
            if ($latest && preg_match('/-(\d{4})$/', $latest->appointment_number, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            do {
                $candidate = sprintf('%s%04d', $prefix, $nextNumber);
                $exists = static::where('appointment_number', $candidate)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $candidate;
        });
    }

    /**
     * Customer associated with this master appointment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Sales Team / Sales Member.
     */
    public function salesTeam(): BelongsTo
    {
        return $this->belongsTo(SalesMember::class, 'sales_team_id');
    }

    /**
     * Admin who created/manages this appointment.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * Individual sessions under this master appointment.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(AppointmentSession::class, 'master_appointment_id')->orderBy('session_number');
    }
}
