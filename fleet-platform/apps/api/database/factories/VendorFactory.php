<?php

namespace Database\Factories;

use App\Models\Vendor;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'name' => $this->faker->company(),
            'contact_email' => $this->faker->companyEmail(),
            'contact_phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->streetAddress(),
            'type' => $this->faker->randomElement(['shop', 'parts_supplier', 'towing']),
            'status' => 'active',
        ];
    }

    public function shop(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'shop',
        ]);
    }

    public function partsSupplier(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'parts_supplier',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
