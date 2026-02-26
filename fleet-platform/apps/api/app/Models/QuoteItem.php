<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QuoteItem extends Model
{
    use HasUuids;

    protected $fillable = ['quote_id', 'description', 'quantity', 'unit_price', 'line_total'];

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }
}
