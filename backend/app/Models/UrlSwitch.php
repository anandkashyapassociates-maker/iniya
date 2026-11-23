<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
