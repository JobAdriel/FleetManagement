<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'recipient_id' => User::factory(),
            'channel' => $this->faker->randomElement(['in_app', 'email']),
            'template' => $this->faker->randomElement(['info', 'warning', 'alert', 'success']),
            'payload' => [
                'title' => $this->faker->sentence(5),
                'message' => $this->faker->paragraph(),
            ],
            'sent_at' => null,
            'status' => 'pending',
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function alert(): static
    {
        return $this->state(fn (array $attributes) => [
            'template' => 'alert',
        ]);
    }

    public function withMetadata(array $metadata): static
    {
        return $this->state(fn (array $attributes) => [
            'payload' => $metadata,
        ]);
    }
}
