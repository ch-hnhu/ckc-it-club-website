<?php

namespace App\Services;

use App\Enums\CourseStatus;
use App\Enums\LessonSectionType;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\LessonProgress;
use Illuminate\Support\Collection;

/**
 * Tính điều kiện hoàn thành khoá học + set completed_at/progress trên CourseEnrollment.
 * Quyết định chốt (2026-06-23):
 * - Online: mỗi buổi có video cần xem ≥80% (LessonSectionType::VIDEO) VÀ mỗi buổi có quiz
 *   cần đạt ngưỡng quiz_pass_threshold của khoá (đã phản ánh qua LessonProgress.is_completed).
 * - Offline: CHỈ xét khi tất cả buổi đã lên lịch (session_end) đã diễn ra — vắng ≤
 *   max_absent_allowed (null = không giới hạn) VÀ mỗi buổi có bài tập đạt ngưỡng VÀ mỗi buổi
 *   có quiz đạt ngưỡng. Lý do chỉ xét sau khi hết lịch: số buổi vắng chưa chốt nếu khoá
 *   chưa học xong, nên hoàn thành sớm sẽ sai.
 */
class CourseCompletionService
{
    public function recalc(CourseEnrollment $enrollment): CourseEnrollment
    {
        $course = $enrollment->course;
        $lessons = $course->lessons()
            ->where('status', CourseStatus::PUBLISHED->value)
            ->with('quiz')
            ->get();

        if ($lessons->isEmpty()) {
            $enrollment->progress = 0;
            $enrollment->save();

            return $enrollment;
        }

        $progressRows = LessonProgress::where('user_id', $enrollment->user_id)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->get()
            ->groupBy('lesson_id');

        [$percent, $isDone] = $enrollment->track === 'offline'
            ? $this->evaluateOffline($enrollment, $course, $lessons, $progressRows)
            : $this->evaluateOnline($lessons, $progressRows);

        // Hoàn thành "dính" một khi đã đạt (cùng pattern với quiz pass) — recalc sau đó (vd admin
        // sửa điểm) không tự rút lại completed_at; thu hồi là hành động chủ động riêng (mục chứng chỉ).
        $justCompleted = $isDone && ! $enrollment->completed_at;

        $enrollment->progress = $percent;
        if ($justCompleted) {
            $enrollment->completed_at = now();
        }
        $enrollment->save();

        // Tự động cấp chứng chỉ + cộng điểm thưởng ngay khi vừa chuyển sang hoàn thành — chỉ gọi
        // đúng một lần lúc chuyển trạng thái, không gọi lại mỗi lần recalc trên enrollment đã
        // hoàn thành (tránh cấp đè chứng chỉ admin đã chủ động thu hồi / cộng điểm trùng).
        if ($justCompleted) {
            app(CourseCertificateService::class)->issue($enrollment);
            PointService::award($enrollment->user, 'learning_center.course_completed', $enrollment);
        }

        return $enrollment;
    }

    /**
     * @param  Collection<int,Lesson>  $lessons
     * @param  Collection<int,Collection<int,LessonProgress>>  $progressRows
     * @return array{0:int,1:bool}
     */
    private function evaluateOnline(Collection $lessons, Collection $progressRows): array
    {
        $total = 0;
        $done = 0;

        foreach ($lessons as $lesson) {
            if ($lesson->playableVideoUrl()) {
                $total++;
                $done += $this->isSectionDone($progressRows, $lesson->id, LessonSectionType::VIDEO) ? 1 : 0;
            }
            if ($lesson->quiz) {
                $total++;
                $done += $this->isSectionDone($progressRows, $lesson->id, LessonSectionType::QUIZ) ? 1 : 0;
            }
        }

        if ($total === 0) {
            return [0, false];
        }

        return [(int) round($done / $total * 100), $done === $total];
    }

    /**
     * @param  Collection<int,Lesson>  $lessons
     * @param  Collection<int,Collection<int,LessonProgress>>  $progressRows
     * @return array{0:int,1:bool}
     */
    private function evaluateOffline(
        CourseEnrollment $enrollment,
        Course $course,
        Collection $lessons,
        Collection $progressRows
    ): array {
        $now = now();
        $scheduledLessons = $lessons->filter(fn (Lesson $l) => $l->session_end !== null);
        $pastLessons = $scheduledLessons->filter(fn (Lesson $l) => $l->session_end->lt($now));
        $allSessionsDone = $scheduledLessons->isNotEmpty()
            && $pastLessons->count() === $scheduledLessons->count();

        $attendedCount = LessonAttendance::where('user_id', $enrollment->user_id)
            ->whereIn('lesson_id', $scheduledLessons->pluck('id'))
            ->count();
        $absent = max(0, $scheduledLessons->count() - $attendedCount);
        $withinAbsentLimit = $course->max_absent_allowed === null || $absent <= $course->max_absent_allowed;

        $assignmentLessons = $lessons->filter(fn (Lesson $l) => (bool) $l->assignment_url);
        $quizLessons = $lessons->filter(fn (Lesson $l) => (bool) $l->quiz);

        $assignmentsDoneCount = $assignmentLessons
            ->filter(fn (Lesson $l) => $this->isSectionDone($progressRows, $l->id, LessonSectionType::ASSIGNMENT))
            ->count();
        $quizzesDoneCount = $quizLessons
            ->filter(fn (Lesson $l) => $this->isSectionDone($progressRows, $l->id, LessonSectionType::QUIZ))
            ->count();

        $total = $scheduledLessons->count() + $assignmentLessons->count() + $quizLessons->count();
        $done = $attendedCount + $assignmentsDoneCount + $quizzesDoneCount;
        $percent = $total > 0 ? (int) round($done / $total * 100) : 0;

        $isDone = $allSessionsDone
            && $withinAbsentLimit
            && $assignmentsDoneCount === $assignmentLessons->count()
            && $quizzesDoneCount === $quizLessons->count();

        return [$percent, $isDone];
    }

    /**
     * @param  Collection<int,Collection<int,LessonProgress>>  $progressRows
     */
    private function isSectionDone(Collection $progressRows, int $lessonId, LessonSectionType $type): bool
    {
        $rows = $progressRows->get($lessonId);
        if (! $rows) {
            return false;
        }

        $row = $rows->first(fn (LessonProgress $p) => $p->section_type === $type);

        return (bool) ($row?->is_completed);
    }
}
