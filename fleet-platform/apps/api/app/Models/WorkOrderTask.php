<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkOrderTask extends Model
{
    use HasUuids;

    protected $fillable = ['work_order_id', 'description', 'status', 'assigned_to', 'estimated_hours', 'actual_hours'];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }
}
