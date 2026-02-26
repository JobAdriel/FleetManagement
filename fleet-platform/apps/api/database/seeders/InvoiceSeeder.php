<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = Tenant::where('slug', 'acb')->first();
        $sgsTenant = Tenant::where('slug', 'sgs')->first();

        if (!$acbTenant || !$sgsTenant) {
            $this->command->warn('Tenants not found. Run TenantSeeder first.');
            return;
        }

        $invoices = [
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260201-1001',
                'subtotal' => 50000.00,
                'tax' => 6000.00,
                'total' => 56000.00,
                'due_date' => '2026-03-01',
                'status' => 'paid',
                'notes' => 'Fleet maintenance services for January 2026',
                'created_at' => now()->subDays(25),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260210-1002',
                'subtotal' => 75000.00,
                'tax' => 9000.00,
                'total' => 84000.00,
                'due_date' => '2026-03-10',
                'status' => 'sent',
                'notes' => 'Vehicle repairs and parts replacement',
                'created_at' => now()->subDays(15),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260215-1003',
                'subtotal' => 120000.00,
                'tax' => 14400.00,
                'total' => 134400.00,
                'due_date' => '2026-03-15',
                'status' => 'sent',
                'notes' => 'Preventive maintenance for 15 vehicles',
                'created_at' => now()->subDays(10),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260220-1004',
                'subtotal' => 35000.00,
                'tax' => 4200.00,
                'total' => 39200.00,
                'due_date' => '2026-03-20',
                'status' => 'draft',
                'notes' => 'Emergency repair services',
                'created_at' => now()->subDays(5),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260222-1005',
                'subtotal' => 95000.00,
                'tax' => 11400.00,
                'total' => 106400.00,
                'due_date' => '2026-03-25',
                'status' => 'sent',
                'notes' => 'Monthly fleet management services',
                'created_at' => now()->subDays(3),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260224-1006',
                'subtotal' => 42000.00,
                'tax' => 5040.00,
                'total' => 47040.00,
                'due_date' => '2026-04-01',
                'status' => 'draft',
                'notes' => 'Oil change and tire rotation services',
                'created_at' => now()->subDays(1),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260205-1007',
                'subtotal' => 28000.00,
                'tax' => 3360.00,
                'total' => 31360.00,
                'due_date' => '2026-02-20',
                'status' => 'disputed',
                'notes' => 'Disputed charges for additional work',
                'created_at' => now()->subDays(20),
            ],
            [
                'tenant_id' => $acbTenant->id,
                'customer_tenant_id' => $sgsTenant->id,
                'invoice_number' => 'INV-20260101-1008',
                'subtotal' => 185000.00,
                'tax' => 22200.00,
                'total' => 207200.00,
                'due_date' => '2026-02-15',
                'status' => 'paid',
                'notes' => 'Annual fleet inspection and certification',
                'created_at' => now()->subDays(55),
            ],
        ];

        foreach ($invoices as $invoiceData) {
            $invoice = Invoice::create([
                'id' => Str::uuid(),
                ...$invoiceData,
            ]);

            // Create sample invoice items for each invoice
            $this->createInvoiceItems($invoice);
        }

        $this->command->info('Created ' . count($invoices) . ' invoices with items.');
    }

    private function createInvoiceItems(Invoice $invoice): void
    {
        $itemsCount = rand(2, 5);
        $itemTypes = [
            ['Labor - Mechanic', 1500.00],
            ['Oil Filter', 450.00],
            ['Engine Oil (5L)', 2800.00],
            ['Brake Pads (Set)', 3500.00],
            ['Air Filter', 800.00],
            ['Tire Rotation', 1200.00],
            ['Battery Replacement', 5500.00],
            ['Transmission Fluid', 2200.00],
            ['Coolant Flush', 1800.00],
            ['Wheel Alignment', 2500.00],
        ];

        for ($i = 0; $i < $itemsCount; $i++) {
            $item = $itemTypes[array_rand($itemTypes)];
            $quantity = rand(1, 4);
            $unitPrice = $item[1];
            $tax = $unitPrice * $quantity * 0.12; // 12% tax

            InvoiceItem::create([
                'id' => Str::uuid(),
                'invoice_id' => $invoice->id,
                'description' => $item[0],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'tax' => $tax,
            ]);
        }
    }
}
