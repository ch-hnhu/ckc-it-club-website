<?php

namespace App\Enums;

enum ClubInformationType: string
{
    case TEXT = 'text'; // Tên CLB, slogan, email
    case LONGTEXT = 'longtext'; // Văn bản dài thuần: prompt AI, ghi chú dài
    case HTML = 'html'; // Trang chính sách, giới thiệu
    case MARKDOWN = 'markdown'; // Nội dung markdown dài
    case URL = 'url'; // Link mạng xã hội
    case IMAGE = 'image'; // Logo, favicon
    case BANNER = 'banner'; // Banner, slider
    case BOOLEAN = 'boolean'; // Cho phép đăng ký, maintenance mode

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
