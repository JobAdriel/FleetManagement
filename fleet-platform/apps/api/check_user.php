<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

try {
    $user = \App\Models\User::where('email', 'admin@acb.local')->first();
    
    if ($user) {
        echo "User exists:\n";
        echo "ID: " . $user->id . "\n";
        echo "Name: " . $user->name . "\n";
        echo "Email: " . $user->email . "\n";
        echo "Tenant ID: " . $user->tenant_id . "\n";
    } else {
        echo "User NOT found in database\n";
        echo "Total users: " . \App\Models\User::count() . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
