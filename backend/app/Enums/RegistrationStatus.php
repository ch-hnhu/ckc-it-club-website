<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case REGISTERED = 'registered';
    case CANCELLED = 'cancelled';
    case ATTENDED = 'attended';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
