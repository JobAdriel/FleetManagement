<?php

namespace Database\Factories;

use App\Models\Quote;
use App\Models\Rfq;
use App\Models\Vendor;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class QuoteFactory extends Factory
{
    protected $model = Quote::class;

    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 100, 5000);
        $tax = $subtotal * 0.1;
        
        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'rfq_id' => Rfq::factory(),
            'vendor_id' => Vendor::factory(),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax,
            'status' => $this->faker->randomElement(['draft', 'sent', 'approved', 'rejected']),
            'validity_until' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'version' => 1,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
