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

    public function completionThreshold(): int
    {
        return match ($this) {
            self::VIDEO => 80,      // xem >= 80% video
            self::ASSIGNMENT => 80, // điểm >= 80/100
            self::QUIZ => 80,       // quiz score >= 80/100
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
