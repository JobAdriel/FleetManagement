<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = DB::select('PRAGMA table_info(work_orders)');

echo "Work Orders Table Columns:\n";
echo "==========================\n";
foreach ($columns as $column) {
    echo "- {$column->name} ({$column->type})\n";
}

echo "\n";

// Check if there are any work orders
$count = DB::table('work_orders')->count();
echo "Total work orders: {$count}\n";

if ($count > 0) {
    $sample = DB::table('work_orders')->first();
    echo "\nSample work order:\n";
    print_r($sample);
}
