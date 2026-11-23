<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class UrlSwitch extends Model
{
    use HasFactory;

    protected $table = 'url';

    protected $fillable = [
        'api_url',
        'db_database',
        'db_username',
        'db_password',
    ];

    /**
     * Decrypt db_password when accessed by application / controller / command.
     */
    public function getDbPasswordAttribute($value)
    {
        if (empty($value)) {
            return '';
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return $value; // Fallback if plain text
        }
    }

    /**
     * Automatically encrypt db_password before saving to database.
     */
    public function setDbPasswordAttribute($value)
    {
        if (empty($value)) {
            $this->attributes['db_password'] = '';
            return;
        }

        // Check if value is already encrypted to prevent double-encryption
        try {
            Crypt::decryptString($value);
            $this->attributes['db_password'] = $value;
        } catch (\Throwable $e) {
            $this->attributes['db_password'] = Crypt::encryptString($value);
        }
    }

    /**
     * Backward-compatibility accessor for url attribute.
     */
    public function getUrlAttribute()
    {
        return $this->api_url;
    }

    /**
     * Backward-compatibility mutator for url attribute.
     */
    public function setUrlAttribute($value)
    {
        $this->attributes['api_url'] = $value;
    }
}
