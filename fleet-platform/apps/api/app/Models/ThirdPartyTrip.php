<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ThirdPartyTrip extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'vehicle_id', 'third_party_provider', 'trip_date', 'cost', 'description'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
