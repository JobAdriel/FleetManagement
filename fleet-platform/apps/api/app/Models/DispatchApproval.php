<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DispatchApproval extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'dispatch_request_id', 'approved_by', 'status', 'comments'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function dispatchRequest()
    {
        return $this->belongsTo(DispatchRequest::class);
    }
}
