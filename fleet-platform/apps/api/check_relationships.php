<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get work orders and their quotes
$workOrders = DB::table('work_orders')->get();

echo "Checking work order relationships...\n\n";

foreach ($workOrders as $wo) {
    echo "Work Order: {$wo->id}\n";
    echo "  Quote ID: {$wo->quote_id}\n";
    
    $quote = DB::table('quotes')->where('id', $wo->quote_id)->first();
    if ($quote) {
        echo "  Quote exists: YES\n";
        echo "  Quote RFQ ID: " . ($quote->rfq_id ?? 'NULL') . "\n";
        
        if (isset($quote->rfq_id)) {
            $rfq = DB::table('rfqs')->where('id', $quote->rfq_id)->first();
            if ($rfq) {
                echo "  RFQ exists: YES\n";
                echo "  RFQ Service Request ID: " . ($rfq->service_request_id ?? 'NULL') . "\n";
                
                if (isset($rfq->service_request_id)) {
                    $sr = DB::table('service_requests')->where('id', $rfq->service_request_id)->first();
                    if ($sr) {
                        echo "  Service Request exists: YES\n";
                        echo "  Vehicle ID: " . ($sr->vehicle_id ?? 'NULL') . "\n";
                    } else {
                        echo "  Service Request exists: NO\n";
                    }
                }
            } else {
                echo "  RFQ exists: NO\n";
            }
        }
    } else {
        echo "  Quote exists: NO\n";
    }
    echo "\n";
}
