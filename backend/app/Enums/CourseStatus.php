<?php

namespace App\Enums;

enum CourseStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Bản nháp',
            self::PUBLISHED => 'Đã đăng',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
