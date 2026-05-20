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

    public static function adminRoles(): array
    {
        return [
            self::ADMIN->value,
            self::PRESIDENT->value,
            self::VICE_PRESIDENT->value,
            self::ACADEMIC_HEAD->value,
            self::COMMUNICATIONS_HEAD->value,
            self::VOLUNTEER_HEAD->value,
        ];
    }

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Quản trị viên',
            self::PRESIDENT => 'Chủ nhiệm CLB',
            self::VICE_PRESIDENT => 'Phó Chủ nhiệm CLB',
            self::ACADEMIC_HEAD => 'Trưởng ban Học thuật',
            self::COMMUNICATIONS_HEAD => 'Trưởng ban Truyền thông',
            self::VOLUNTEER_HEAD => 'Trưởng ban Tình nguyện',
            self::CLUB_MEMBER => 'Thành viên CLB',
            self::USER => 'Người dùng',
        };
    }
}
