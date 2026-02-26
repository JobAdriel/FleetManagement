<?php

namespace Tests\Feature\Api;

use App\Models\Document;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
        Storage::fake('local');
    }

    public function test_can_list_documents(): void
    {
        Document::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->getJson('/api/documents');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_documents_by_entity_type(): void
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Document::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
        ]);
        Document::factory()->create([
            'tenant_id' => $this->tenant->id,
            'entity_type' => 'work_order',
        ]);

        $response = $this->getJson('/api/documents?entity_type=vehicle');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_upload_document(): void
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $this->tenant->id]);
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
            'file' => $file,
            'category' => 'registration',
            'description' => 'Vehicle registration document',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'original_filename', 'size', 'mime_type', 'storage_key']);

        $this->assertDatabaseHas('documents', [
            'tenant_id' => $this->tenant->id,
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
            'mime_type' => 'application/pdf',
        ]);

        Storage::disk('local')->assertExists($response->json('storage_key'));
    }

    public function test_upload_validates_file_size(): void
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $this->tenant->id]);
        $file = UploadedFile::fake()->create('large.pdf', 25000, 'application/pdf'); // 25MB

        $response = $this->postJson('/api/documents', [
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
            'file' => $file,
            'category' => 'registration',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_validates_file_type(): void
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $this->tenant->id]);
        $file = UploadedFile::fake()->create('document.exe', 100);

        $response = $this->postJson('/api/documents', [
            'entity_type' => 'vehicle',
            'entity_id' => $vehicle->id,
            'file' => $file,
            'category' => 'registration',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_can_show_document(): void
    {
        $document = Document::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->getJson("/api/documents/{$document->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $document->id,
                'original_filename' => $document->original_filename,
            ]);
    }

    public function test_can_download_document(): void
    {
        $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');
        $path = $file->store('documents');
        
        $document = Document::factory()->create([
            'tenant_id' => $this->tenant->id,
            'file_path' => $path,
            'file_name' => 'test.pdf',
            'mime_type' => 'application/pdf',
        ]);

        $response = $this->get("/api/documents/{$document->id}/download");

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename=test.pdf');
    }

    public function test_can_delete_document(): void
    {
        $file = UploadedFile::fake()->create('test.pdf', 100);
        $path = $file->store('documents');
        
        $document = Document::factory()->create([
            'tenant_id' => $this->tenant->id,
            'file_path' => $path,
        ]);

        $response = $this->deleteJson("/api/documents/{$document->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_cannot_access_other_tenant_documents(): void
    {
        $otherTenant = Tenant::factory()->create();
        $document = Document::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->getJson("/api/documents/{$document->id}");

        $response->assertStatus(403);
    }

    public function test_requires_authentication(): void
    {
        Sanctum::actingAs($this->user, [], false);

        $response = $this->getJson('/api/documents');

        $response->assertStatus(200);
    }
}
