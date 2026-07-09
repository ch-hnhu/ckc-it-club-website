<?php

namespace App\Enums;

enum LessonSectionType: string
{
    case VIDEO = 'video';
    case ASSIGNMENT = 'assignment';
    case QUIZ = 'quiz';

    public function label(): string
    {
        return match ($this) {
            self::VIDEO => 'Bài giảng',
            self::ASSIGNMENT => 'Bài tập',
            self::QUIZ => 'Quiz',
        };
    }

    /**
     * Ngưỡng hoàn thành chỉ áp dụng cho VIDEO (% xem).
     * ASSIGNMENT: do admin chấm thủ công (pass/fail).
     * QUIZ: dùng Course::quiz_pass_threshold, không dùng hàm này.
     */
    public function videoWatchThreshold(): int
    {
        return 80;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
