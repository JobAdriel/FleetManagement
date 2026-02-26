<?php

namespace Tests\Unit\Models;

use App\Models\Document;
use App\Models\Vehicle;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_belongs_to_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $document = Document::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertInstanceOf(Tenant::class, $document->tenant);
        $this->assertEquals($tenant->id, $document->tenant->id);
    }

    public function test_document_has_polymorphic_entity_relation(): void
    {
        $vehicle = Vehicle::factory()->create();
        $document = Document::factory()->create([
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
        ]);

        $this->assertEquals('vehicle', $document->entity_type);
        $this->assertEquals($vehicle->id, $document->entity_id);
    }

    public function test_document_has_uuid_as_primary_key(): void
    {
        $document = Document::factory()->create();

        $this->assertIsString($document->id);
        $this->assertEquals(36, strlen($document->id));
    }

    public function test_document_fillable_attributes(): void
    {
        $fillableAttributes = [
            'tenant_id',
            'storage_key',
            'original_filename',
            'mime_type',
            'size',
            'checksum',
            'entity_type',
            'entity_id',
        ];

        $document = new Document();

        $this->assertEquals($fillableAttributes, $document->getFillable());
    }

    public function test_document_can_be_registration_storage_prefix(): void
    {
        $document = Document::factory()->registration()->create();

        $this->assertStringContainsString('documents/registration/', $document->storage_key);
    }

    public function test_document_can_be_insurance_storage_prefix(): void
    {
        $document = Document::factory()->insurance()->create();

        $this->assertStringContainsString('documents/insurance/', $document->storage_key);
    }

    public function test_document_casts_size_to_integer(): void
    {
        $document = Document::factory()->create(['size' => '12345']);

        $this->assertIsInt($document->size);
        $this->assertEquals(12345, $document->size);
    }

    public function test_document_scope_for_vehicle(): void
    {
        $vehicle1 = Vehicle::factory()->create();
        $vehicle2 = Vehicle::factory()->create();

        Document::factory()->count(3)->create([
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle1->id,
        ]);
        Document::factory()->count(2)->create([
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle2->id,
        ]);

        $vehicle1Docs = Document::where('entity_type', 'vehicle')
            ->where('entity_id', $vehicle1->id)
            ->get();

        $this->assertCount(3, $vehicle1Docs);
    }
}
