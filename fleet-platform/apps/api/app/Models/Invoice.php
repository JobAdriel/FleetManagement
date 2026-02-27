<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'customer_tenant_id',
        'work_order_id',
        'invoice_number',
        'subtotal',
        'tax',
        'total',
        'due_date',
        'status',
        'pdf_document_id',
        'notes',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Tenant::class, 'customer_tenant_id');
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }
}
