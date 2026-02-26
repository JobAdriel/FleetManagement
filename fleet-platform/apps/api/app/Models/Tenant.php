<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'slug', 'description', 'config', 'is_active'];
    protected $casts = ['config' => 'array'];
}
