<?php

namespace App\Enums;

enum QuestionTypeKey: string
{
    case MULTIPLE_CHOICE = 'multiple_choice';
    case MULTIPLE_SELECT = 'multiple_select';
    case FILL_BLANK = 'fill_blank';
    case WORD_BANK_FILL_BLANK = 'word_bank_fill_blank';
    case MATCHING = 'matching';
    case WORD_ORDER = 'word_order';

    public function label(): string
    {
        return match ($this) {
            self::MULTIPLE_CHOICE => 'Trắc nghiệm',
            self::MULTIPLE_SELECT => 'Chọn nhiều đáp án',
            self::FILL_BLANK => 'Điền vào chỗ trống',
            self::WORD_BANK_FILL_BLANK => 'Chọn từ điền vào chỗ trống',
            self::MATCHING => 'Ghép đôi',
            self::WORD_ORDER => 'Chọn từ và sắp xếp đúng thứ tự',
        };
    }

    // Các type có đáp án đúng/sai trên từng option (is_correct).
    // matching và word_order dùng metadata: correctness nằm trong option.metadata, không dùng is_correct.
    public function usesIsCorrect(): bool
    {
        return match ($this) {
            self::MULTIPLE_CHOICE,
            self::MULTIPLE_SELECT,
            self::FILL_BLANK,
            self::WORD_BANK_FILL_BLANK,
            self::MATCHING,
            self::WORD_ORDER => false,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
