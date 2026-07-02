<?php

namespace App\Traits;

use App\Enums\LessonSectionType;
use App\Models\Course;
use App\Models\Lesson;

/**
 * Tập id các buổi học đang bị khoá + các helper tính tiến độ phụ trợ.
 * Dùng chung cho CourseController và QuizController.
 */
trait HasSequentialLessonLock
{
    /**
     * @param  \Illuminate\Support\Collection<int,Lesson>  $lessons  đã sắp theo thứ tự
     * @return array<int,int>  danh sách lesson id bị khoá
     */
    private function lockedLessonIds(Course $course, $lessons, ?int $userId, ?string $track): array
    {
        $isCompleted = fn (Lesson $l) => $this->lessonProgressPercent($l, $userId, $track) === 100;

        if ($course->max_offline_slots === null) {
            $nextOpenId = $lessons->first(fn (Lesson $l) => ! $isCompleted($l))?->id;

            return $lessons
                ->filter(fn (Lesson $l) => ! $isCompleted($l) && $l->id !== $nextOpenId)
                ->pluck('id')
                ->all();
        }

        $now = now();
        $nearestUpcomingId = $lessons
            ->filter(fn (Lesson $l) => $l->session_start && $l->session_start->gt($now))
            ->sortBy('session_start')
            ->first()?->id;

        return $lessons
            ->filter(function (Lesson $l) use ($isCompleted, $now, $nearestUpcomingId) {
                if ($isCompleted($l)) {
                    return false;
                }
                if ($l->session_start && $l->session_start->lte($now)) {
                    return false;
                }

                return $l->id !== $nearestUpcomingId;
            })
            ->pluck('id')
            ->all();
    }

    private function lessonProgressPercent(Lesson $lesson, ?int $userId, ?string $track = null): ?int
    {
        $present = [];
        if ($track !== 'offline' && $lesson->playableVideoUrl()) {
            $present[] = 'video';
        }
        if ($track !== 'online' && $lesson->assignment_url) {
            $present[] = 'assignment';
        }
        $hasQuiz = $lesson->relationLoaded('quiz')
            ? (bool) $lesson->quiz
            : $lesson->quiz()->where('is_published', true)->exists();
        if ($hasQuiz) {
            $present[] = 'quiz';
        }

        if (empty($present)) {
            return null;
        }

        $done = $this->sectionCompletionMap($lesson, $userId);
        $completed = count(array_intersect($present, array_keys($done)));

        return (int) round($completed / count($present) * 100);
    }

    /**
     * @return array<string,bool>
     */
    private function sectionCompletionMap(Lesson $lesson, ?int $userId): array
    {
        if (! $userId) {
            return [];
        }

        return $lesson->progress()
            ->where('user_id', $userId)
            ->where('is_completed', true)
            ->pluck('section_type')
            ->mapWithKeys(fn ($type) => [
                $type instanceof LessonSectionType ? $type->value : $type => true,
            ])
            ->all();
    }
}
