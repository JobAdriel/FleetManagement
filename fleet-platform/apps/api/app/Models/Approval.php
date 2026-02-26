<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'user_id', 'entity_type', 'entity_id', 'status', 'comments'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
