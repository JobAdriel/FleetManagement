<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ServiceHistory extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'vehicle_id', 'service_type', 'description', 'cost', 'service_date', 'mileage'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
