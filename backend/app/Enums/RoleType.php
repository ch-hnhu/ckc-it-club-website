<?php

namespace App\Enums;

/**
 * Role Types
 *
 * Định nghĩa các loại vai trò trong hệ thống
 */
enum RoleType: int
{
    case ADMIN = 1;
    case PRESIDENT = 2;
    case VICE_PRESIDENT = 3;
    case ACADEMIC_HEAD = 4;
    case COMMUNICATIONS_HEAD = 5;
    case VOLUNTEER_HEAD = 6;
    case CLUB_MEMBER = 7;
    case USER = 8;

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
