<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Populating vehicle_id for existing work orders...\n";

$workOrders = DB::table('work_orders')
    ->whereNull('vehicle_id')
    ->orWhere('vehicle_id', '')
    ->get();

echo "Found {$workOrders->count()} work orders to update\n\n";

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
        
        echo "✓ Updated work order {$workOrder->id} with vehicle {$vehicleId}\n";
    } else {
        echo "✗ Could not find vehicle for work order {$workOrder->id}\n";
    }
}

echo "\nDone!\n";

// Verify
$updated = DB::table('work_orders')->whereNotNull('vehicle_id')->where('vehicle_id', '!=', '')->count();
echo "\nTotal work orders with vehicle_id: {$updated}\n";
