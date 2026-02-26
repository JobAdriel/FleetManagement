<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a user to simulate the auth token
$user = \App\Models\User::where('email', 'admin@acb.local')->first();

if (!$user) {
    echo "User not found\n";
    exit;
}

// Create a Sanctum token
$token = $user->createToken('test')->plainTextToken;

echo "Test Token: " . substr($token, 0, 20) . "...\n\n";

// Get a work order ID
$workOrderId = '019c9408-d19c-7299-b33b-372a30a4d6ee';

// Prepare update data
$updateData = [
    'vehicle_id' => '019c93cd-31d6-71f4-8e74-8fa9c9a7ab3d',
    'status' => 'in_progress',
];

echo "Testing update endpoint...\n";
echo "Work Order ID: {$workOrderId}\n";
echo "Update Data: " . json_encode($updateData) . "\n\n";

// Simulate what the browser sends
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/work-orders/{$workOrderId}");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "Response Status: {$info['http_code']}\n";
echo "Response:\n";
echo $response;
