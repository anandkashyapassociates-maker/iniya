<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UrlSwitch extends Model
{
    use HasFactory;

    protected $table = 'url';

    protected $fillable = [
        'url',
        'db_database',
        'db_username',
        'previous_url',
        'previous_db_database',
        'previous_db_username',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
