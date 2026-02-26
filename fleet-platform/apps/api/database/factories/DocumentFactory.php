<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Tenant;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        $filename = $this->faker->word() . '.pdf';

        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'entity_type' => 'vehicle',
            'entity_id' => Vehicle::factory(),
            'storage_key' => 'documents/other/' . Str::uuid() . '.pdf',
            'original_filename' => $filename,
            'size' => $this->faker->numberBetween(1000, 5000000),
            'mime_type' => 'application/pdf',
            'checksum' => hash('sha256', $filename),
        ];
    }

    public function forVehicle($vehicleId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'vehicle',
            'entity_id' => $vehicleId ?? Vehicle::factory(),
        ]);
    }

    public function forServiceRequest($serviceRequestId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'service_request',
            'entity_id' => $serviceRequestId,
        ]);
    }

    public function registration(): static
    {
        return $this->state(fn (array $attributes) => [
            'storage_key' => 'documents/registration/' . Str::uuid() . '.pdf',
        ]);
    }

    public function insurance(): static
    {
        return $this->state(fn (array $attributes) => [
            'storage_key' => 'documents/insurance/' . Str::uuid() . '.pdf',
        ]);
    }
}
