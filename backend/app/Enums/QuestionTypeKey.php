<?php

namespace App\Enums;

enum QuestionTypeKey: string
{
    case MULTIPLE_CHOICE = 'multiple_choice';
    case MULTIPLE_SELECT = 'multiple_select';
    case FILL_BLANK      = 'fill_blank';
    case MATCHING        = 'matching';
    case ORDERING        = 'ordering';

    public function label(): string
    {
        return match ($this) {
            self::MULTIPLE_CHOICE => 'Trắc nghiệm',
            self::MULTIPLE_SELECT => 'Chọn nhiều đáp án',
            self::FILL_BLANK      => 'Điền vào chỗ trống',
            self::MATCHING        => 'Ghép đôi',
            self::ORDERING        => 'Sắp xếp',
        };
    }

    // Các type có đáp án đúng/sai trên từng option (is_correct).
    // matching và ordering: correctness nằm trong option.metadata, không dùng is_correct.
    public function usesIsCorrect(): bool
    {
        return match ($this) {
            self::MULTIPLE_CHOICE,
            self::MULTIPLE_SELECT,
            self::FILL_BLANK  => true,
            self::MATCHING,
            self::ORDERING    => false,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
