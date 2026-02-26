<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['tenant_id', 'quote_id', 'vehicle_id', 'shop_id', 'assigned_to', 'start_at', 'complete_at', 'status'];

    protected $casts = [
        'start_at' => 'datetime',
        'complete_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function shop()
    {
        return $this->belongsTo(Vendor::class, 'shop_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function tasks()
    {
        return $this->hasMany(WorkOrderTask::class);
    }

    public function parts()
    {
        return $this->hasMany(WorkOrderPart::class);
    }
}
