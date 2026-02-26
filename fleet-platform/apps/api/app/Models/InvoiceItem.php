<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasUuids;

    protected $fillable = ['invoice_id', 'description', 'quantity', 'unit_price', 'tax'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
