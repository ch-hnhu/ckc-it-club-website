<?php

namespace App\Jobs;

use App\Events\CommentVisibilityChanged;
use App\Models\Comment;
use App\Services\CommentModerationService;
use App\Services\UserNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Kiểm duyệt bình luận bằng AI chạy nền.
 *
 * Bình luận được đăng công khai ngay; job này chấm điểm sau và ẩn nếu vi phạm,
 * kèm broadcast để người đang xem bài (post) thấy bình luận biến mất realtime.
 */
class ModerateCommentJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(public readonly int $commentId) {}

    public function handle(CommentModerationService $moderation): void
    {
        $comment = Comment::find($this->commentId);

        // Bình luận có thể đã bị xóa hoặc admin ẩn tay trong lúc chờ queue.
        if (! $comment || $comment->is_hidden) {
            return;
        }

        $result = $moderation->check($comment->content);

        $comment->forceFill(['moderated_at' => now()]);

        if ($result['flagged']) {
            $comment->forceFill([
                'is_hidden'         => true,
                'moderation_reason' => $result['reason'],
            ]);
        }

        $comment->save();

        if (! $result['flagged']) {
            return;
        }

        // Ẩn realtime khỏi người đang xem bài viết.
        if ($comment->post_id) {
            broadcast(new CommentVisibilityChanged(
                commentId: $comment->id,
                postId:    $comment->post_id,
                isHidden:  true,
            ));
        }

        // Thông báo cho tác giả biết bình luận đã bị ẩn do vi phạm.
        $comment->loadMissing('user', 'blog');
        if ($comment->user) {
            UserNotificationService::dispatchCommentModerated(
                $comment->user,
                $comment,
                $result['reason'] ?? 'Vi phạm tiêu chuẩn cộng đồng',
            );
        }
    }
}
