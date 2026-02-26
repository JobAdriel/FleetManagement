<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    use HasUuids;

    protected $fillable = ['key', 'value', 'is_enabled', 'description'];

    protected $casts = ['is_enabled' => 'boolean'];
}
