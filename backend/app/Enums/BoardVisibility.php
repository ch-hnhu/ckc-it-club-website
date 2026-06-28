<?php

namespace App\Enums;

enum BoardVisibility: string
{
    case PRIVATE = 'private';
    case MEMBERS = 'members';
    case PUBLIC = 'public';

    public function label(): string
    {
        return match ($this) {
            self::PRIVATE => 'Riêng tư',
            self::MEMBERS => 'Thành viên',
            self::PUBLIC => 'Công khai',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
