<?php

namespace App\Enums;

enum EventStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ONGOING = 'ongoing';
    case ENDED = 'ended';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Bản nháp',
            self::PUBLISHED => 'Đã đăng',
            self::ONGOING => 'Đang diễn ra',
            self::ENDED => 'Đã kết thúc',
            self::CANCELLED => 'Đã hủy',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
