<?php

namespace App\Jobs;

use App\Models\Post;
use App\Services\CommentModerationService;
use App\Services\UserNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;

/**
 * Kiểm duyệt bài đăng bằng AI chạy nền.
 *
 * Bài đăng hiển thị công khai ngay; job này chấm điểm sau và chuyển sang
 * status = 'hidden' nếu vi phạm, kèm thông báo cho tác giả.
 */
class ModeratePostJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    /** Giới hạn ký tự gửi lên AI để tiết kiệm token; vi phạm hầu như lộ sớm. */
    private const MAX_CHARS = 8000;

    public function __construct(public readonly int $postId) {}

    public function handle(CommentModerationService $moderation): void
    {
        $post = Post::find($this->postId);

        // Chỉ kiểm duyệt bài đang công khai; bỏ qua nếu đã bị ẩn/lưu trữ/xóa.
        if (! $post || $post->status !== 'published') {
            return;
        }

        // Gộp tiêu đề + nội dung (bỏ HTML), cắt bớt cho gọn.
        $text = Str::limit(
            trim($post->title . "\n\n" . strip_tags((string) $post->content)),
            self::MAX_CHARS,
            '',
        );

        $result = $moderation->check($text);

        $post->forceFill(['moderated_at' => now()]);

        if ($result['flagged']) {
            $post->forceFill([
                'status'            => 'hidden',
                'moderation_reason' => $result['reason'],
            ]);
        }

        $post->save();

        if (! $result['flagged']) {
            return;
        }

        // Thông báo cho tác giả biết bài đăng đã bị ẩn do vi phạm.
        $post->loadMissing('user');
        if ($post->user) {
            UserNotificationService::dispatchPostModerated(
                $post->user,
                $post,
                $result['reason'] ?? 'Vi phạm tiêu chuẩn cộng đồng',
            );
        }
    }
}
