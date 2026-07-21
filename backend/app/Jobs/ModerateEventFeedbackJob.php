<?php

namespace App\Jobs;

use App\Models\EventFeedback;
use App\Services\CommentModerationService;
use App\Services\UserNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Kiểm duyệt nhận xét trong đánh giá sự kiện bằng AI chạy nền.
 *
 * Đánh giá hiển thị công khai ngay; job này chấm điểm phần nhận xét sau và ẩn
 * nếu vi phạm, kèm thông báo cho người đánh giá. Điểm sao (rating) không bị coi
 * là vi phạm nên vẫn được giữ trong thống kê tổng hợp.
 */
class ModerateEventFeedbackJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(public readonly int $feedbackId) {}

    public function handle(CommentModerationService $moderation): void
    {
        $feedback = EventFeedback::find($this->feedbackId);

        // Đánh giá có thể đã bị xóa hoặc admin ẩn tay trong lúc chờ queue.
        if (! $feedback || $feedback->is_hidden || trim((string) $feedback->comment) === '') {
            return;
        }

        $result = $moderation->check((string) $feedback->comment);

        $feedback->forceFill(['moderated_at' => now()]);

        if ($result['flagged']) {
            $feedback->forceFill([
                'is_hidden'         => true,
                'moderation_reason' => $result['reason'],
            ]);
        }

        $feedback->save();

        if (! $result['flagged']) {
            return;
        }

        // Thông báo cho người đánh giá biết nhận xét đã bị ẩn do vi phạm.
        $feedback->loadMissing('user', 'event');
        if ($feedback->user) {
            UserNotificationService::dispatchEventFeedbackModerated(
                $feedback->user,
                $feedback,
                $result['reason'] ?? 'Vi phạm tiêu chuẩn cộng đồng',
            );
        }
    }
}
