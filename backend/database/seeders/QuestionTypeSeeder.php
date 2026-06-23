<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuestionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['key' => 'multiple_choice', 'label' => 'Trắc nghiệm'],
            ['key' => 'multiple_select', 'label' => 'Chọn nhiều đáp án'],
            ['key' => 'fill_blank', 'label' => 'Điền vào chỗ trống'],
            ['key' => 'word_bank_fill_blank', 'label' => 'Chọn từ điền vào chỗ trống'],
            ['key' => 'matching', 'label' => 'Ghép đôi'],
            ['key' => 'word_order', 'label' => 'Sắp xếp từ thành câu'],
        ];

        foreach ($types as $type) {
            DB::table('question_types')->updateOrInsert(
                ['key' => $type['key']],
                $type + ['created_at' => now(), 'updated_at' => now()],
            );
        }
    }
}
