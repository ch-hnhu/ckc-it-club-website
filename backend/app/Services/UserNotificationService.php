<?php

namespace App\Services;

use App\Events\NotificationSent;
use App\Models\Blog;
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
        string $commentContent,
        int $commentId,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => "{$actor->full_name} đã bình luận vào bài viết của bạn",
            'message'     => $commentContent,
            'type'        => 'comment',
            'target_type' => 'post',
            'target_id'   => $post->id,
            'link'        => "/cong-dong/bai-viet/{$post->id}#comment-{$commentId}",
        ]);
    }

    /**
     * Notify a comment author when another user replies to their comment on a post.
     * Does nothing if the actor is the comment author.
     * Link points to the parent comment anchor (only depth-0 comments have DOM ids).
     */
    public static function dispatchCommentReply(
        User $recipient,
        User $actor,
        int $replyCommentId,
        Post $post,
        string $replyContent,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => "{$actor->full_name} đã trả lời bình luận của bạn",
            'message'     => $replyContent,
            'type'        => 'comment_reply',
            'target_type' => 'post',
            'target_id'   => $post->id,
            'link'        => "/cong-dong/bai-viet/{$post->id}#comment-{$replyCommentId}",
        ]);
    }

    /**
     * Notify a comment author when another user replies to their comment on a blog.
     * Does nothing if the actor is the comment author.
     */
    public static function dispatchBlogCommentReply(
        User $recipient,
        User $actor,
        int $replyCommentId,
        Blog $blog,
        string $replyContent,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => "{$actor->full_name} đã trả lời bình luận của bạn",
            'message'     => $replyContent,
            'type'        => 'blog_comment_reply',
            'target_type' => 'blog',
            'target_id'   => $blog->id,
            'link'        => "/blog/{$blog->slug}#comment-{$replyCommentId}",
        ]);
    }

    /**
     * Notify the blog author when another user comments on their blog.
     * Does nothing if the actor is the author.
     */
    public static function dispatchBlogComment(
        User $recipient,
        User $actor,
        Blog $blog,
        string $commentContent,
        int $commentId,
    ): void {
        if ($recipient->id === $actor->id) {
            return;
        }

        self::send($recipient, $actor, [
            'title'       => "{$actor->full_name} đã bình luận vào blog của bạn",
            'message'     => $commentContent,
            'type'        => 'blog_comment',
            'target_type' => 'blog',
            'target_id'   => $blog->id,
            'link'        => "/blog/{$blog->slug}#comment-{$commentId}",
        ]);
    }

    /**
     * Notify the blog author when an admin approves (publishes) their blog.
     */
    public static function dispatchBlogApproved(
        User $recipient,
        User $actor,
        Blog $blog,
    ): void {
        self::send($recipient, $actor, [
            'title'       => 'Blog được duyệt',
            'message'     => "Blog \"{$blog->title}\" của bạn đã được duyệt và xuất bản",
            'type'        => 'blog_approved',
            'target_type' => 'blog',
            'target_id'   => $blog->id,
            'link'        => "/blog/{$blog->slug}",
        ]);
    }

    /**
     * Notify an applicant when an admin updates their club application status.
     */
    public static function dispatchApplicationStatusUpdate(
        User $recipient,
        User $actor,
        string $newStatus,
        int $applicationId,
    ): void {
        [$title, $message] = match ($newStatus) {
            'processing' => [
                'Đơn ứng tuyển đang được xét duyệt',
                'Đơn ứng tuyển của bạn đang được Ban Nhân sự CKC IT CLUB xem xét.',
            ],
            'interview' => [
                'Bạn được mời phỏng vấn!',
                'Chúc mừng! Đơn ứng tuyển của bạn đã vượt qua vòng hồ sơ. Ban Nhân sự sẽ liên hệ để sắp xếp lịch phỏng vấn.',
            ],
            'passed' => [
                'Chào mừng bạn đến với CKC IT CLUB!',
                'Chúc mừng! Bạn đã chính thức trở thành thành viên của CKC IT CLUB.',
            ],
            'failed' => [
                'Kết quả xét tuyển',
                'Rất tiếc, đơn ứng tuyển của bạn chưa đáp ứng yêu cầu trong đợt xét tuyển này. Chúc bạn may mắn lần sau!',
            ],
            default => [
                'Cập nhật trạng thái đơn ứng tuyển',
                'Trạng thái đơn ứng tuyển của bạn vừa được cập nhật.',
            ],
        };

        self::send($recipient, $actor, [
            'title'       => $title,
            'message'     => $message,
            'type'        => 'application_status',
            'target_type' => 'club_application',
            'target_id'   => $applicationId,
            'link'        => '/ung-tuyen',
        ]);
    }

    /**
     * Notify a comment author when another user reacts to their blog comment.
     * Does nothing if the actor is the comment author.
     */
    public static function dispatchBlogCommentReaction(
        User $recipient,
        User $actor,
        Blog $blog,
        int $commentId,
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
            'title'         => 'Bình luận được yêu thích',
            'message'       => "{$actor->full_name} đã thả {$reactionLabel} bình luận của bạn",
            'type'          => 'blog_comment_reaction',
            'reaction_type' => $reactionType,
            'target_type'   => 'blog',
            'target_id'     => $blog->id,
            'link'          => "/blog/{$blog->slug}#comment-{$commentId}",
        ]);
    }

    /**
     * Notify a user when someone follows them.
     */
    public static function dispatchFollow(
        User $recipient,
        User $actor,
    ): void {
        self::send($recipient, $actor, [
            'title'       => "{$actor->full_name} đã bắt đầu theo dõi bạn",
            'message'     => "Hãy ghé thăm trang cá nhân của họ!",
            'type'        => 'follow',
            'target_type' => 'user',
            'target_id'   => $actor->id,
            'link'        => "/@{$actor->username}",
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

    /**
     * Notify the reporter when an admin hides content they reported.
     * Sends a real-time WebSocket push + DB notification.
     */
    public static function dispatchReportResolved(
        User $reporter,
        User $admin,
        string $contentType,   // 'post' | 'blog'
        string $contentTitle,
    ): void {
        $label = $contentType === 'post' ? 'bài viết' : 'blog';

        self::send($reporter, $admin, [
            'title'       => 'Báo cáo vi phạm đã được xử lý',
            'message'     => "Báo cáo của bạn về {$label} \"{$contentTitle}\" đã được xem xét. Nội dung vi phạm đã bị ẩn.",
            'type'        => 'report_resolved',
            'target_type' => "{$contentType}_report",
            'target_id'   => 0,
            'link'        => '',
        ]);
    }

    /**
     * Notify the reporter when an admin dismisses their report (no violation found).
     * Sends a real-time WebSocket push + DB notification.
     */
    public static function dispatchReportDismissed(
        User $reporter,
        User $admin,
        string $contentType,
        string $contentTitle,
        string $contentLink,
    ): void {
        $label = $contentType === 'post' ? 'bài viết' : 'blog';

        self::send($reporter, $admin, [
            'title'       => 'Báo cáo vi phạm đã được xem xét',
            'message'     => "Báo cáo của bạn về {$label} \"{$contentTitle}\" đã được xem xét. Chúng tôi không tìm thấy vi phạm trong nội dung này.",
            'type'        => 'report_dismissed',
            'target_type' => "{$contentType}_report",
            'target_id'   => 0,
            'link'        => $contentLink,
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
