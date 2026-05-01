<?php

namespace App\Enums;

/**
 * Role Types
 *
 * Định nghĩa các loại vai trò trong hệ thống
 */
enum RolesEnum: string
{
    case ADMIN = 'admin';
    case PRESIDENT = 'president';
    case VICE_PRESIDENT = 'vice-president';
    case ACADEMIC_HEAD = 'academic-head';
    case COMMUNICATIONS_HEAD = 'communications-head';
    case VOLUNTEER_HEAD = 'volunteer-head';
    case CLUB_MEMBER = 'club-member';
    case USER = 'user';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin',
            self::PRESIDENT => 'Chủ nhiệm',
            self::VICE_PRESIDENT => 'Phó Chủ nhiệm',
            self::ACADEMIC_HEAD => 'Trưởng ban Học thuật',
            self::COMMUNICATIONS_HEAD => 'Trưởng ban Truyền thông',
            self::VOLUNTEER_HEAD => 'Trưởng ban Tình nguyện',
            self::CLUB_MEMBER => 'Thành viên CLB',
            self::USER => 'User',
        };
    }
}
