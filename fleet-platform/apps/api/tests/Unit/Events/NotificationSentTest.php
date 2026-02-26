<?php

namespace Tests\Unit\Events;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationSentTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_on_private_user_channel(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['recipient_id' => $user->id]);
        
        $event = new NotificationSent($notification);
        
        $channels = $event->broadcastOn();
        
        $this->assertIsArray($channels);
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
    }

    public function test_event_broadcast_channel_name(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['recipient_id' => $user->id]);
        
        $event = new NotificationSent($notification);
        
        $channels = $event->broadcastOn();
        
        $this->assertEquals("private-user.{$user->id}", $channels[0]->name);
    }

    public function test_event_broadcast_data(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create([
            'recipient_id' => $user->id,
            'template' => 'alert',
            'payload' => [
                'title' => 'Test Notification',
                'message' => 'Test message content',
            ],
        ]);
        
        $event = new NotificationSent($notification);
        
        $data = $event->broadcastWith();
        
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('template', $data);
        $this->assertArrayHasKey('payload', $data);
        $this->assertEquals($notification->id, $data['id']);
        $this->assertEquals('alert', $data['template']);
        $this->assertEquals('Test Notification', $data['payload']['title']);
        $this->assertEquals('Test message content', $data['payload']['message']);
    }

    public function test_event_broadcast_as_custom_name(): void
    {
        $notification = Notification::factory()->create();
        
        $event = new NotificationSent($notification);
        
        $this->assertEquals('notification.sent', $event->broadcastAs());
    }

    public function test_event_stores_notification(): void
    {
        $notification = Notification::factory()->create();
        
        $event = new NotificationSent($notification);
        
        $this->assertSame($notification, $event->notification);
    }
}
