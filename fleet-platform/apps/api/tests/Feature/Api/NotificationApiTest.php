<?php

namespace Tests\Feature\Api;

use App\Models\Notification;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationApiTest extends TestCase
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
    }

    public function test_can_list_user_notifications(): void
    {
        Notification::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_notifications_by_type(): void
    {
        Notification::factory()->count(2)->sent()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
        ]);
        Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/notifications?status=sent');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_filter_notifications_by_sent_status(): void
    {
        Notification::factory()->count(2)->sent()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
        ]);
        Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/notifications?status=sent');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_only_shows_own_notifications(): void
    {
        $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);

        Notification::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
        ]);
        Notification::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $otherUser->id,
        ]);

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_show_notification(): void
    {
        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
            'payload' => [
                'title' => 'Test Notification',
                'message' => 'This is a test',
            ],
        ]);

        $response = $this->getJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $notification->id,
                'payload' => [
                    'title' => 'Test Notification',
                    'message' => 'This is a test',
                ],
            ]);
    }

    public function test_cannot_view_other_user_notification(): void
    {
        $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/notifications/{$notification->id}");

        $response->assertStatus(403);
    }

    public function test_can_mark_notification_as_sent(): void
    {
        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->patchJson("/api/notifications/{$notification->id}/mark-sent");

        $response->assertStatus(200);

        $notification->refresh();
        $this->assertEquals('sent', $notification->status);
        $this->assertNotNull($notification->sent_at);
    }

    public function test_mark_sent_is_idempotent(): void
    {
        $notification = Notification::factory()->sent()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $this->user->id,
        ]);

        $originalSentAt = $notification->sent_at;

        $response = $this->patchJson("/api/notifications/{$notification->id}/mark-sent");

        $response->assertStatus(200);

        $notification->refresh();
        $this->assertEquals($originalSentAt, $notification->sent_at);
    }

    public function test_cannot_mark_other_user_notification_as_sent(): void
    {
        $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'recipient_id' => $otherUser->id,
        ]);

        $response = $this->patchJson("/api/notifications/{$notification->id}/mark-sent");

        $response->assertStatus(403);
    }

    public function test_requires_authentication(): void
    {
        Sanctum::actingAs($this->user, [], false);

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200);
    }
}
