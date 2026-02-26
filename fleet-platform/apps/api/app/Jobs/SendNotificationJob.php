<?php

namespace App\Jobs;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tenantId;
    public $recipientId;
    public $template;
    public $payload;
    public $channel;

    public function __construct(
        string $tenantId,
        string $recipientId,
        string $template,
        array|string $payload = [],
        string $channel = 'in_app'
    ) {
        $this->tenantId = $tenantId;
        $this->recipientId = $recipientId;
        $this->template = $template;
        $this->payload = is_array($payload) ? $payload : ['message' => $payload];
        $this->channel = $channel;
    }

    public function handle(): void
    {
        $recipient = User::find($this->recipientId);

        if (!$recipient || $recipient->tenant_id !== $this->tenantId) {
            Log::warning('Notification recipient mismatch or not found', [
                'tenant_id' => $this->tenantId,
                'recipient_id' => $this->recipientId,
            ]);
            return;
        }

        $notification = Notification::create([
            'tenant_id' => $this->tenantId,
            'recipient_id' => $this->recipientId,
            'template' => $this->template,
            'payload' => $this->payload,
            'channel' => $this->channel,
            'status' => 'pending',
        ]);

        // Simulated "send" logic (replace with real implementation: email, SMS, etc.)
        if ($this->channel === 'in_app') {
            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
            // Broadcast notification in real-time
            event(new NotificationSent($notification));
        } elseif ($this->channel === 'email') {
            // TODO: Integrate mail driver or external service
            Log::info('Email notification would be sent', [
                'recipient' => $recipient->email,
                'template' => $this->template,
            ]);
            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
            // Broadcast notification in real-time
            event(new NotificationSent($notification));
        } else {
            $notification->update(['status' => 'failed']);
        }
    }
}
