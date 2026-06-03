<?php

namespace App\Services;

use App\Events\NotificationSent;
use App\Models\Post;
use App\Models\User;
use App\Notifications\UserCommunityNotification;

class UserNotificationService
{
    /**
     * Notify the post owner when another user reacts to their post.
     * Does nothing if the actor is the post owner.
     */
    public static function dispatchReaction(
        User $recipient,
        User $actor,
        Post $post,
        string $reactionType,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        $reactionLabel = match ($reactionType) {
            'heart' => 'tim',
            'like'  => 'thích',
            'haha'  => 'haha',
            'wow'   => 'wow',
            'sad'   => 'buồn',
            default => 'thích',
        };

        self::send($recipient, $actor, [
            'title'         => 'Bài viết được yêu thích',
            'message'       => "{$actor->full_name} đã thả {$reactionLabel} bài viết của bạn",
            'type'          => 'reaction',
            'reaction_type' => $reactionType,
            'target_type'   => 'post',
            'target_id'     => $post->id,
            'link'          => "/cong-dong/bai-viet/{$post->id}",
        ]);
    }

    /**
     * Notify the post owner when another user comments on their post.
     * Does nothing if the actor is the post owner.
     */
    public static function dispatchComment(
        User $recipient,
        User $actor,
        Post $post,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => 'Bình luận mới',
            'message'     => "{$actor->full_name} đã bình luận bài viết của bạn",
            'type'        => 'comment',
            'target_type' => 'post',
            'target_id'   => $post->id,
            'link'        => "/cong-dong/bai-viet/{$post->id}",
        ]);
    }

    /**
     * Notify a user when they are @mentioned in a post or comment.
     */
    public static function dispatchMention(
        User $recipient,
        User $actor,
        string $targetType,
        int $targetId,
        string $link,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => 'Bạn được nhắc đến',
            'message'     => "{$actor->full_name} đã nhắc đến bạn",
            'type'        => 'mention',
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'link'        => $link,
        ]);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    /**
     * Persist the notification to the database and push it in real-time
     * via WebSocket to the recipient's private channel.
     */
    private static function send(User $recipient, User $actor, array $data): void
    {
        // Attach actor details once — every notification type carries this
        $data['actor'] = [
            'id'        => $actor->id,
            'full_name' => $actor->full_name,
            'avatar'    => $actor->avatar,
            'username'  => $actor->username,
        ];

        // 1. Persist to DB via Laravel's notification system
        $recipient->notify(new UserCommunityNotification($data));

        // 2. Retrieve the just-created notification ID
        $saved = $recipient->notifications()->latest()->first();

        // 3. Push real-time via Reverb WebSocket (private channel per user).
        //    Payload mirrors the DB notification shape so the frontend can
        //    handle WS events and REST responses with one type.
        broadcast(new NotificationSent(
            $recipient->id,
            [
                'id'         => $saved?->id,
                'data'       => $data,   // nested under 'data' — matches $user->notifications() format
                'read_at'    => null,
                'created_at' => now()->toISOString(),
            ],
        ));
    }
}
