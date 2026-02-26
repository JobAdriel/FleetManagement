<?php

namespace Tests\Unit\Models;

use App\Models\Notification;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_belongs_to_recipient(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['recipient_id' => $user->id]);

        $this->assertInstanceOf(User::class, $notification->recipient);
        $this->assertEquals($user->id, $notification->recipient->id);
    }

    public function test_notification_belongs_to_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $notification = Notification::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertInstanceOf(Tenant::class, $notification->tenant);
        $this->assertEquals($tenant->id, $notification->tenant->id);
    }

    public function test_notification_can_be_sent(): void
    {
        $notification = Notification::factory()->sent()->create();

        $this->assertEquals('sent', $notification->status);
        $this->assertNotNull($notification->sent_at);
    }

    public function test_notification_defaults_to_pending(): void
    {
        $notification = Notification::factory()->create();

        $this->assertEquals('pending', $notification->status);
        $this->assertNull($notification->sent_at);
    }

    public function test_notification_has_uuid_as_primary_key(): void
    {
        $notification = Notification::factory()->create();

        $this->assertIsString($notification->id);
        $this->assertEquals(36, strlen($notification->id));
    }

    public function test_notification_fillable_attributes(): void
    {
        $fillableAttributes = [
            'tenant_id',
            'recipient_id',
            'channel',
            'template',
            'payload',
            'sent_at',
            'status',
        ];

        $notification = new Notification();

        $this->assertEquals($fillableAttributes, $notification->getFillable());
    }

    public function test_notification_casts_payload_to_array(): void
    {
        $payload = ['key' => 'value', 'count' => 5];
        $notification = Notification::factory()->create(['payload' => $payload]);

        $this->assertIsArray($notification->payload);
        $this->assertEquals($payload, $notification->payload);
    }

    public function test_notification_has_pending_status_by_default(): void
    {
        $notification = Notification::factory()->create();

        $this->assertSame('pending', $notification->status);
    }

    public function test_notification_can_have_alert_template(): void
    {
        $notification = Notification::factory()->alert()->create();

        $this->assertEquals('alert', $notification->template);
    }

    public function test_notification_scope_pending(): void
    {
        Notification::factory()->count(3)->create(['status' => 'pending']);
        Notification::factory()->count(2)->sent()->create();

        $pending = Notification::where('status', 'pending')->get();

        $this->assertCount(3, $pending);
        $this->assertTrue($pending->every(fn($n) => $n->status === 'pending'));
    }
}
