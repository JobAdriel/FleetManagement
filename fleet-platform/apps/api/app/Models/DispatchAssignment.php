<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DispatchAssignment extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'vehicle_id', 'driver_id', 'dispatch_request_id', 'status', 'assigned_at', 'completed_at'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
