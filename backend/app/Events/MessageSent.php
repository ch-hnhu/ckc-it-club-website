<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("chat.{$this->message->room_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing('creator:id,full_name,email,avatar,username');

        if ($this->message->reply_to_id) {
            $this->message->loadMissing(['replyTo' => fn ($q) => $q->with('creator:id,full_name')]);
        }

        $creator = $this->message->creator;

        return [
            'id'         => $this->message->id,
            'content'    => $this->message->content,
            'created_by' => $creator ? [
                'id'        => $creator->id,
                'full_name' => $creator->full_name,
                'email'     => $creator->email,
                'avatar'    => $creator->avatar,
                'username'  => $creator->username,
            ] : null,
            'reply_to'   => $this->message->replyTo ? [
                'id'        => $this->message->replyTo->id,
                'content'   => $this->message->replyTo->content,
                'full_name' => $this->message->replyTo->creator?->full_name,
            ] : null,
            'created_at' => $this->message->created_at->toIso8601String(),
        ];
    }
}
