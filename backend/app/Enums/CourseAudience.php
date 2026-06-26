<?php

namespace App\Enums;

enum CourseAudience: string
{
    case CLUB_MEMBER = 'club_member';
    case CAO_THANG_STUDENT = 'cao_thang_student';
    case PUBLIC = 'public';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::CLUB_MEMBER => 'Thành viên câu lạc bộ',
            self::CAO_THANG_STUDENT => 'Sinh viên Cao Thắng',
            self::PUBLIC => 'Công khai',
        };
    }
}
