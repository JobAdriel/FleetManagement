<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->company();

        return [
            'id' => Str::uuid()->toString(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $this->faker->optional()->sentence(),
            'config' => [
                'timezone' => 'UTC',
                'currency' => 'USD',
            ],
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
