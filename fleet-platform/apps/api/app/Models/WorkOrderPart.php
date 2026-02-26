<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkOrderPart extends Model
{
    use HasUuids;

    protected $fillable = ['work_order_id', 'part_name', 'part_number', 'quantity', 'unit_cost', 'cost'];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }
}
