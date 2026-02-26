<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Simulate what the API returns for work orders index
$workOrders = DB::table('work_orders')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

echo "Work Orders from Database (raw):\n";
echo "================================\n";
foreach ($workOrders as $wo) {
    echo "\nWork Order ID: {$wo->id}\n";
    echo "  vehicle_id: " . ($wo->vehicle_id ?? 'NULL') . "\n";
    
    if ($wo->vehicle_id) {
        $vehicle = DB::table('vehicles')->where('id', $wo->vehicle_id)->first();
        if ($vehicle) {
            echo "  Vehicle Make: {$vehicle->make}\n";
            echo "  Vehicle Model: {$vehicle->model}\n";
            echo "  Vehicle Plate: " . ($vehicle->license_plate ?? $vehicle->plate_number ?? 'N/A') . "\n";
        } else {
            echo "  Vehicle: NOT FOUND\n";
        }
    }
}

echo "\n\n";
echo "Work Orders using Eloquent (like the API):\n";
echo "==========================================\n";

$eloquentWorkOrders = \App\Models\WorkOrder::with(['vehicle', 'quote', 'shop'])
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($eloquentWorkOrders as $wo) {
    echo "\nWork Order ID: {$wo->id}\n";
    echo "  vehicle_id: " . ($wo->vehicle_id ?? 'NULL') . "\n";
    echo "  vehicle object: " . ($wo->vehicle ? 'EXISTS' : 'NULL') . "\n";
    
    if ($wo->vehicle) {
        echo "  Vehicle Make: {$wo->vehicle->make}\n";
        echo "  Vehicle Model: {$wo->vehicle->model}\n";
        echo "  Vehicle Plate: " . ($wo->vehicle->license_plate ?? $wo->vehicle->plate_number ?? 'N/A') . "\n";
    }
}
