<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a work order
$workOrder = \App\Models\WorkOrder::first();

if (!$workOrder) {
    echo "No work orders found\n";
    exit;
}

echo "Testing work order update...\n";
echo "Work Order ID: {$workOrder->id}\n";
echo "Current vehicle_id: " . ($workOrder->vehicle_id ?? 'NULL') . "\n\n";

// Get a vehicle
$vehicle = DB::table('vehicles')->first();

if (!$vehicle) {
    echo "No vehicles found\n";
    exit;
}

echo "Updating with vehicle: {$vehicle->id}\n";
echo "Vehicle Make: {$vehicle->make}\n";
echo "Vehicle Model: {$vehicle->model}\n\n";

// Update the work order
$workOrder->update(['vehicle_id' => $vehicle->id]);

echo "Updated successfully!\n";
echo "New vehicle_id: {$workOrder->vehicle_id}\n\n";

// Refresh and load relationships
$fresh = $workOrder->fresh(['vehicle', 'quote', 'shop']);

echo "After fresh() reload:\n";
echo "  vehicle_id: {$fresh->vehicle_id}\n";
echo "  vehicle object: " . ($fresh->vehicle ? 'EXISTS' : 'NULL') . "\n";

if ($fresh->vehicle) {
    echo "  Vehicle Make: {$fresh->vehicle->make}\n";
    echo "  Vehicle Model: {$fresh->vehicle->model}\n";
    echo "  Vehicle Plate: {$fresh->vehicle->license_plate}\n";
}
