<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a user for auth token
$user = DB::table('users')->first();

if (!$user) {
    echo "No users found\n";
    exit;
}

echo "User found: {$user->email}\n";
echo "User tenant_id: {$user->tenant_id}\n\n";

// Get work orders
$workOrders = DB::table('work_orders')->get();

echo "Work Orders:\n";
foreach ($workOrders as $wo) {
    echo "  ID: {$wo->id}\n";
    echo "  Tenant ID: {$wo->tenant_id}\n";
    echo "  User tenant matches: " . ($wo->tenant_id === $user->tenant_id ? 'YES' : 'NO') . "\n\n";
}

// Try to find the specific work order
$woId = '019c9408-d19c-7299-b33b-372a30a4d6ee';
$wo = DB::table('work_orders')->where('id', $woId)->first();

if ($wo) {
    echo "Work Order {$woId} found!\n";
    echo "  tenant_id: {$wo->tenant_id}\n";
    echo "  User tenant matches: " . ($wo->tenant_id === $user->tenant_id ? 'YES' : 'NO') . "\n";
} else {
    echo "Work Order {$woId} NOT found!\n";
}

// Check routes
echo "\nChecking routes...\n";
$routes = Route::getRoutes();
$workOrderRoutes = array_filter($routes->getRoutes(), function($route) {
    return str_contains($route->uri(), 'work-orders');
});

foreach ($workOrderRoutes as $route) {
    echo "  {$route->methods()[0]} {$route->uri()}\n";
}
