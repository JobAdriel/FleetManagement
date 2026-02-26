<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->recipient_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notification->id,
            'channel' => $this->notification->channel,
            'template' => $this->notification->template,
            'payload' => $this->notification->payload,
            'status' => $this->notification->status,
            'created_at' => $this->notification->created_at->toIso8601String(),
        ];
    }
}
