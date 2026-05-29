<?php

namespace App\Enums;

enum ReactionType: string
{
    case Heart = 'heart';
    case Like  = 'like';
    case Haha  = 'haha';
    case Wow   = 'wow';
    case Sad   = 'sad';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
