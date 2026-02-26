<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PreventiveRule extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'name', 'trigger_type', 'trigger_value', 'action', 'is_active'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
