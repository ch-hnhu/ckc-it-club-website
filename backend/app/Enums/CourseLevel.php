<?php

namespace App\Enums;

enum CourseLevel: string
{
    case BEGINNER = 'beginner';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED = 'advanced';

    public function label(): string
    {
        return match ($this) {
            self::BEGINNER => 'Cơ bản',
            self::INTERMEDIATE => 'Trung cấp',
            self::ADVANCED => 'Nâng cao',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
