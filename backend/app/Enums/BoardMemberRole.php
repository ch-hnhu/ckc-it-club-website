<?php

namespace App\Enums;

enum BoardMemberRole: string
{
    case OWNER = 'owner';
    case EDITOR = 'editor';
    case VIEWER = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::OWNER => 'Chủ sở hữu',
            self::EDITOR => 'Biên tập',
            self::VIEWER => 'Người xem',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
