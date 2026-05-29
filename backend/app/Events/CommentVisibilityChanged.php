<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentVisibilityChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int  $commentId,
        public readonly int  $postId,
        public readonly bool $isHidden,
    ) {}

    /**
     * Broadcast on a public channel per post.
     * Public channel — no auth required (any visitor can subscribe).
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("post.{$this->postId}"),
        ];
    }

    /** Custom event name (frontend listens on this) */
    public function broadcastAs(): string
    {
        return 'comment.visibility.changed';
    }

    /** Payload sent to the client */
    public function broadcastWith(): array
    {
        return [
            'comment_id' => $this->commentId,
            'post_id'    => $this->postId,
            'is_hidden'  => $this->isHidden,
        ];
    }
}
