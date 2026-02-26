<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['tenant_id', 'rfq_id', 'rfq_code', 'vendor_id', 'subtotal', 'tax', 'total', 'validity_until', 'status', 'version'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function quoteItems()
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class);
    }
}
