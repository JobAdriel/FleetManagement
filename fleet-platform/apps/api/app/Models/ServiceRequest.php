<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['tenant_id', 'vehicle_id', 'issue_description', 'priority', 'status'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function rfqs()
    {
        return $this->hasMany(Rfq::class);
    }
}
