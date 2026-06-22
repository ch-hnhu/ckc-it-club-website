<?php

namespace App\Services;

use App\Models\QuizQuestion;
use Illuminate\Support\Collection;

/**
 * Chấm điểm câu trả lời quiz phía server (nguồn sự thật).
 *
 * Mỗi loại câu hỏi có một định dạng `answer_data` riêng:
 *  - multiple_choice / multiple_select / true_false : {"selected": [option_id, ...]}
 *  - fill_blank                                      : {"text": "..."}
 *  - word_bank_fill_blank                            : {"slots": [option_id_blank0, option_id_blank1, ...]}
 *  - word_order                                      : {"order": [option_id, ...]}
 *  - matching                                        : {"pairs": [[left_id, right_id], ...]}
 *
 * Quy ước metadata option khớp với trình tạo quiz (admin):
 *  - word_bank/word_order : {"slot_index": int} trên các option đúng
 *  - matching             : {"side": "left"|"right", "pairId": string}
 */
class QuizGradingService
{
    /**
     * @param  array<string,mixed>  $answer  answer_data đã decode
     */
    public function isCorrect(QuizQuestion $question, array $answer): bool
    {
        $type = $question->type?->key ?? 'multiple_choice';
        $options = $question->options; // đã orderBy('order')

        return match ($type) {
            'multiple_choice', 'multiple_select' => $this->gradeChoice($options, $answer),
            'fill_blank' => $this->gradeFillBlank($options, $answer),
            'word_bank_fill_blank' => $this->gradeWordBank($options, $answer),
            'word_order' => $this->gradeWordOrder($options, $answer),
            'matching' => $this->gradeMatching($options, $answer),
            default => false,
        };
    }

    /** Tập id các option đúng phải khớp đúng tập id user chọn. */
    private function gradeChoice(Collection $options, array $answer): bool
    {
        $correct = $options->where('is_correct', true)->pluck('id')->map(fn ($id) => (int) $id)->sort()->values();
        if ($correct->isEmpty()) {
            return false;
        }
        $selected = collect($answer['selected'] ?? [])->map(fn ($id) => (int) $id)->unique()->sort()->values();

        return $selected->all() === $correct->all();
    }

    /** Văn bản nhập khớp (không phân biệt hoa/thường, bỏ khoảng trắng đầu/cuối) với một đáp án đúng. */
    private function gradeFillBlank(Collection $options, array $answer): bool
    {
        $text = $this->normalize((string) ($answer['text'] ?? ''));
        if ($text === '') {
            return false;
        }

        return $options
            ->where('is_correct', true)
            ->contains(fn ($o) => $this->normalize((string) $o->content) === $text);
    }

    /** Mỗi chỗ trống i phải được điền bằng đúng option có slot_index = i. */
    private function gradeWordBank(Collection $options, array $answer): bool
    {
        $slots = $answer['slots'] ?? null;
        if (! is_array($slots) || $slots === []) {
            return false;
        }

        $correctBySlot = $options
            ->where('is_correct', true)
            ->keyBy(fn ($o) => (int) ($o->metadata['slot_index'] ?? -1));

        if ($correctBySlot->count() !== count($slots)) {
            return false;
        }

        foreach ($slots as $i => $optionId) {
            $expected = $correctBySlot->get($i);
            if (! $expected || (int) $expected->id !== (int) $optionId) {
                return false;
            }
        }

        return true;
    }

    /** Thứ tự option user xếp phải khớp các option đúng (có slot_index) theo slot_index. */
    private function gradeWordOrder(Collection $options, array $answer): bool
    {
        $order = collect($answer['order'] ?? [])->map(fn ($id) => (int) $id)->values();
        $expected = $options
            ->where('is_correct', true)
            ->sortBy(fn ($o) => (int) ($o->metadata['slot_index'] ?? 0))
            ->pluck('id')->map(fn ($id) => (int) $id)->values();

        return $order->all() === $expected->all();
    }

    /** Mọi option "left" phải ghép với option "right" cùng pairId. */
    private function gradeMatching(Collection $options, array $answer): bool
    {
        $pairs = $answer['pairs'] ?? null;
        if (! is_array($pairs)) {
            return false;
        }

        $byId = $options->keyBy(fn ($o) => (int) $o->id);
        $expectedPairCount = $options->where(fn ($o) => ($o->metadata['side'] ?? null) === 'left')->count();

        if (count($pairs) !== $expectedPairCount || $expectedPairCount === 0) {
            return false;
        }

        foreach ($pairs as $pair) {
            if (! is_array($pair) || count($pair) !== 2) {
                return false;
            }
            $left = $byId->get((int) $pair[0]);
            $right = $byId->get((int) $pair[1]);
            if (! $left || ! $right) {
                return false;
            }
            $leftPair = $left->metadata['pairId'] ?? null;
            $rightPair = $right->metadata['pairId'] ?? null;
            if (! $leftPair || $leftPair !== $rightPair
                || ($left->metadata['side'] ?? null) !== 'left'
                || ($right->metadata['side'] ?? null) !== 'right') {
                return false;
            }
        }

        return true;
    }

    private function normalize(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
    }
}
