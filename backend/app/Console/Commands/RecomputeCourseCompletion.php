<?php

namespace App\Console\Commands;

use App\Models\CourseEnrollment;
use App\Services\CourseCompletionService;
use Illuminate\Console\Command;

/**
 * Quét lại các ghi danh khoá học chưa hoàn thành để tính lại completed_at/progress.
 * Bù cho trường hợp không có hành động nào kích hoạt real-time recalc — điển hình:
 * buổi offline cuối đã qua session_end nhưng không còn check-in/chấm điểm/quiz nào
 * xảy ra sau đó để tự kích hoạt CourseCompletionService.
 */
class RecomputeCourseCompletion extends Command
{
    protected $signature = 'learning:recompute-completion';

    protected $description = 'Tính lại completed_at/progress cho các ghi danh khoá học chưa hoàn thành';

    public function handle(CourseCompletionService $service): int
    {
        $count = 0;

        CourseEnrollment::whereNull('completed_at')
            ->lazy()
            ->each(function (CourseEnrollment $enrollment) use ($service, &$count) {
                $service->recalc($enrollment);
                $count++;
            });

        $this->info("Đã tính lại tiến độ cho {$count} ghi danh.");

        return self::SUCCESS;
    }
}
