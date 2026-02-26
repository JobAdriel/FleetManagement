<?php

namespace Tests\Unit\Jobs;

use App\Events\NotificationSent;
use App\Jobs\SendNotificationJob;
use App\Models\Notification;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SendNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
    }

    public function test_job_creates_notification_record(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertDatabaseCount('notifications', 0);

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'info',
            ['title' => 'Test Title', 'message' => 'Test Message']
        );

        $job->handle();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $tenant->id,
            'recipient_id' => $user->id,
            'template' => 'info',
            'status' => 'sent',
        ]);
    }

    public function test_job_marks_notification_as_sent(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'alert',
            ['title' => 'Alert Title', 'message' => 'Alert Message']
        );

        $job->handle();

        $notification = Notification::first();

        $this->assertSame('sent', $notification->status);
        $this->assertNotNull($notification->sent_at);
    }

    public function test_job_broadcasts_notification_sent_event(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'warning',
            ['title' => 'Warning Title', 'message' => 'Warning Message']
        );

        $job->handle();

        Event::assertDispatched(NotificationSent::class, function ($event) use ($user) {
            return (string) $event->notification->recipient_id === (string) $user->id
                && $event->notification->template === 'warning'
                && ($event->notification->payload['title'] ?? null) === 'Warning Title';
        });
    }

    public function test_job_stores_metadata_if_provided(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $metadata = ['vehicle_id' => 'test-uuid', 'action' => 'status_change'];

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'info',
            $metadata
        );

        $job->handle();

        $notification = Notification::first();

        $this->assertEquals($metadata, $notification->payload);
    }

    public function test_job_handles_empty_metadata(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'success'
        );

        $job->handle();

        $notification = Notification::first();

        $this->assertEquals([], $notification->payload);
    }

    public function test_job_properties_are_public(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $job = new SendNotificationJob(
            $tenant->id,
            $user->id,
            'info',
            ['key' => 'value']
        );

        $this->assertEquals($tenant->id, $job->tenantId);
        $this->assertEquals($user->id, $job->recipientId);
        $this->assertEquals('info', $job->template);
        $this->assertEquals(['key' => 'value'], $job->payload);
    }
}
