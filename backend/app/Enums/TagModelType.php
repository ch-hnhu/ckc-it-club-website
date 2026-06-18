<?php

namespace App\Enums;

enum TagModelType: string
{
    case BLOG = 'blog'; // Tag gắn cho bài viết blog
    case COURSE = 'course'; // Category gắn cho khóa học (learning center)

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
