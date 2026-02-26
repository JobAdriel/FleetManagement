<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'name', 'license_number', 'license_class', 'license_expiry', 'contact_phone', 'contact_email', 'employment_status'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'assigned_driver_id');
    }
}
