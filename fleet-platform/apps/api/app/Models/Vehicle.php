<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['tenant_id', 'plate', 'vin', 'make', 'model', 'year', 'odometer', 'fuel_type', 'status', 'assigned_driver_id', 'cost_center'];

    protected $casts = [
        'year' => 'integer',
        'odometer' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'assigned_driver_id');
    }

    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function dispatchAssignments()
    {
        return $this->hasMany(DispatchAssignment::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'entity_id')->where('entity_type', 'vehicle');
    }

    public function getMileageAttribute(): int
    {
        return (int) $this->odometer;
    }

    public function setMileageAttribute(int|string $value): void
    {
        $this->attributes['odometer'] = (int) $value;
    }
}
