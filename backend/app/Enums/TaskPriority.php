<?php

namespace App\Enums;

enum TaskPriority: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case URGENT = 'urgent';

    public function label(): string
    {
        return match ($this) {
            self::LOW => 'Thấp',
            self::MEDIUM => 'Trung bình',
            self::HIGH => 'Cao',
            self::URGENT => 'Khẩn cấp',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
