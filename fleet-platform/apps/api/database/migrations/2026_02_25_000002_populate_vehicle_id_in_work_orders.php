<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Populate vehicle_id for existing work orders from their quotes
        $workOrders = DB::table('work_orders')
            ->whereNull('vehicle_id')
            ->get();

        foreach ($workOrders as $workOrder) {
            $vehicleId = DB::table('quotes')
                ->join('rfqs', 'quotes.rfq_id', '=', 'rfqs.id')
                ->join('service_requests', 'rfqs.service_request_id', '=', 'service_requests.id')
                ->where('quotes.id', $workOrder->quote_id)
                ->value('service_requests.vehicle_id');

            if ($vehicleId) {
                DB::table('work_orders')
                    ->where('id', $workOrder->id)
                    ->update(['vehicle_id' => $vehicleId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse data migration
    }
};
