<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = [
        'plate_no',
        'make',
        'model',
        'year',
        'status',
        'odometer',
        'notes',
    ];
}