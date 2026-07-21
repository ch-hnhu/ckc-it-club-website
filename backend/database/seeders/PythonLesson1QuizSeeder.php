<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed bộ quiz mẫu cho Buổi 1 ("Cài đặt & Biến") của khoá "Python Nhập Môn".
 *
 * Mục tiêu: phủ đủ 6 loại câu hỏi mà hệ thống hỗ trợ, với nội dung và đáp án
 * Python thật để làm dữ liệu demo/tài liệu tham chiếu cho trình chơi quiz.
 *
 * Quy ước dữ liệu (khớp QuizGradingService + QuizPlayPage):
 *  - multiple_choice / multiple_select : is_correct đánh dấu đáp án đúng.
 *  - fill_blank                        : mỗi option is_correct=true là một đáp án chấp nhận.
 *  - word_bank_fill_blank              : chỗ trống ghi bằng "___" trong content;
 *                                        option đúng có metadata.slot_index = vị trí (0-based),
 *                                        các option còn lại là mồi nhử (distractor).
 *  - word_order                        : mọi option là một "từ"; option đúng có metadata.slot_index
 *                                        theo đúng thứ tự câu.
 *  - matching                          : option trái metadata {side:"left", pairId}, phải {side:"right", pairId}.
 */
class PythonLesson1QuizSeeder extends Seeder
{
    private const COURSE_SLUG = 'python-nhap-mon';

    private const LESSON_SLUG = 'buoi-1-cai-dat-bien';

    public function run(): void
    {
        $courseId = DB::table('courses')->where('slug', self::COURSE_SLUG)->value('id');
        if (! $courseId) {
            $this->command->warn('Khoá "Python Nhập Môn" chưa tồn tại — hãy chạy LearningCenterSeeder trước.');
            return;
        }

        $lessonId = DB::table('lessons')
            ->where('course_id', $courseId)
            ->where('slug', self::LESSON_SLUG)
            ->value('id');
        if (! $lessonId) {
            $this->command->warn('Buổi 1 của khoá Python chưa tồn tại — hãy chạy LearningCenterSeeder trước.');
            return;
        }

        $types = DB::table('question_types')->pluck('id', 'key');
        foreach (['multiple_choice', 'multiple_select', 'fill_blank', 'word_bank_fill_blank', 'matching', 'word_order'] as $key) {
            if (! isset($types[$key])) {
                $this->command->warn("Thiếu question_type \"{$key}\" — hãy chạy QuestionTypeSeeder trước.");
                return;
            }
        }

        // Quiz đã được tạo cùng buổi học trong LearningCenterSeeder; lấy hoặc tạo nếu thiếu.
        $quizId = DB::table('quizzes')->where('lesson_id', $lessonId)->value('id');
        if (! $quizId) {
            $quizId = DB::table('quizzes')->insertGetId([
                'lesson_id' => $lessonId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Idempotent: xoá câu hỏi cũ (bộ mặc định 2 câu trắc nghiệm) rồi nạp lại bộ đầy đủ.
        // options có cascadeOnDelete theo question nên xoá question là đủ.
        DB::table('quiz_questions')->where('quiz_id', $quizId)->delete();

        foreach ($this->questions() as $order => $q) {
            $questionId = DB::table('quiz_questions')->insertGetId([
                'quiz_id' => $quizId,
                'question_type_id' => $types[$q['type']],
                'content' => $q['content'],
                'explanation' => $q['explanation'] ?? null,
                'image' => $q['image'] ?? null,
                'order' => $order + 1,
                'metadata' => isset($q['metadata']) ? json_encode($q['metadata']) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($q['options'] as $optOrder => $opt) {
                DB::table('quiz_question_options')->insert([
                    'question_id' => $questionId,
                    'content' => $opt['content'],
                    'image' => $opt['image'] ?? null,
                    'is_correct' => $opt['is_correct'] ?? false,
                    'order' => $optOrder + 1,
                    'metadata' => isset($opt['metadata']) ? json_encode($opt['metadata']) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('Đã seed quiz Buổi 1 (Python Nhập Môn) với đủ 6 loại câu hỏi + ảnh minh hoạ.');
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function questions(): array
    {
        return [
            // 1) Trắc nghiệm 1 đáp án (multiple_choice) — có ẢNH minh hoạ cho câu hỏi
            [
                'type' => 'multiple_choice',
                'content' => 'Hàm nào dùng để in dữ liệu ra màn hình trong Python?',
                'explanation' => 'Trong Python, print() xuất giá trị ra màn hình. echo là của PHP/shell, còn console.log là của JavaScript.',
                'image' => 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=70',
                'options' => [
                    ['content' => 'print()', 'is_correct' => true],
                    ['content' => 'echo()', 'is_correct' => false],
                    ['content' => 'console.log()', 'is_correct' => false],
                    ['content' => 'printf()', 'is_correct' => false],
                ],
            ],

            // 2) Trắc nghiệm với ĐÁP ÁN LÀ ẢNH (option.image) — nhận diện logo ngôn ngữ
            [
                'type' => 'multiple_choice',
                'content' => 'Đâu là logo chính thức của ngôn ngữ Python?',
                'explanation' => 'Logo Python gồm hai con rắn lồng vào nhau màu xanh dương và vàng. Các logo còn lại là của JavaScript, Java và C.',
                'options' => [
                    [
                        'content' => 'Python',
                        'is_correct' => true,
                        'image' => 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
                    ],
                    [
                        'content' => 'JavaScript',
                        'is_correct' => false,
                        'image' => 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
                    ],
                    [
                        'content' => 'Java',
                        'is_correct' => false,
                        'image' => 'https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg',
                    ],
                    [
                        'content' => 'C',
                        'is_correct' => false,
                        'image' => 'https://upload.wikimedia.org/wikipedia/commons/1/18/C_Programming_Language.svg',
                    ],
                ],
            ],

            // 3) Chọn nhiều đáp án (multiple_select)
            [
                'type' => 'multiple_select',
                'content' => 'Những tên biến nào sau đây HỢP LỆ trong Python? (chọn tất cả đáp án đúng)',
                'explanation' => 'Tên biến hợp lệ chỉ gồm chữ, số và dấu gạch dưới, không bắt đầu bằng số, không chứa khoảng trắng và không trùng từ khoá. "2diem" bắt đầu bằng số, "ho ten" có khoảng trắng, "class" là từ khoá.',
                'options' => [
                    ['content' => 'ten_sinh_vien', 'is_correct' => true],
                    ['content' => '_diem', 'is_correct' => true],
                    ['content' => 'soLuong2', 'is_correct' => true],
                    ['content' => '2diem', 'is_correct' => false],
                    ['content' => 'ho ten', 'is_correct' => false],
                    ['content' => 'class', 'is_correct' => false],
                ],
            ],

            // 4) Điền vào chỗ trống — tự gõ (fill_blank)
            [
                'type' => 'fill_blank',
                'content' => 'Hàm nào trả về kiểu dữ liệu của một biến trong Python? (điền tên hàm, không kèm dấu ngoặc)',
                'explanation' => 'type(x) trả về kiểu dữ liệu của x, ví dụ type(10) → <class \'int\'>.',
                'options' => [
                    // Mọi option is_correct=true là một đáp án được chấp nhận (so khớp không phân biệt hoa/thường).
                    ['content' => 'type', 'is_correct' => true],
                ],
            ],

            // 5) Chọn từ điền vào chỗ trống (word_bank_fill_blank)
            [
                'type' => 'word_bank_fill_blank',
                'content' => 'Để gán giá trị 10 cho biến tuoi, ta viết: tuoi ___ 10. Khi đó kiểu dữ liệu của giá trị 10 là ___.',
                'explanation' => 'Dấu "=" là toán tử gán (còn "==" là so sánh bằng). Số nguyên 10 có kiểu int.',
                'options' => [
                    // Đáp án đúng cho từng chỗ trống — slot_index 0-based theo thứ tự "___" trong content.
                    ['content' => '=', 'is_correct' => true, 'metadata' => ['slot_index' => 0]],
                    ['content' => 'int', 'is_correct' => true, 'metadata' => ['slot_index' => 1]],
                    // Mồi nhử.
                    ['content' => '==', 'is_correct' => false],
                    ['content' => 'str', 'is_correct' => false],
                ],
            ],

            // 6) Ghép đôi (matching)
            [
                'type' => 'matching',
                'content' => 'Ghép mỗi giá trị với kiểu dữ liệu tương ứng trong Python.',
                'explanation' => 'Chuỗi trong dấu nháy là str, số nguyên là int, số thực là float, True/False là bool.',
                'options' => [
                    ['content' => "'Xin chào'", 'is_correct' => true, 'metadata' => ['side' => 'left', 'pairId' => 'p1']],
                    ['content' => 'str', 'is_correct' => true, 'metadata' => ['side' => 'right', 'pairId' => 'p1']],
                    ['content' => '42', 'is_correct' => true, 'metadata' => ['side' => 'left', 'pairId' => 'p2']],
                    ['content' => 'int', 'is_correct' => true, 'metadata' => ['side' => 'right', 'pairId' => 'p2']],
                    ['content' => '3.14', 'is_correct' => true, 'metadata' => ['side' => 'left', 'pairId' => 'p3']],
                    ['content' => 'float', 'is_correct' => true, 'metadata' => ['side' => 'right', 'pairId' => 'p3']],
                    ['content' => 'True', 'is_correct' => true, 'metadata' => ['side' => 'left', 'pairId' => 'p4']],
                    ['content' => 'bool', 'is_correct' => true, 'metadata' => ['side' => 'right', 'pairId' => 'p4']],
                ],
            ],

            // 7) Sắp xếp từ thành câu (word_order)
            [
                'type' => 'word_order',
                'content' => 'Sắp xếp các thành phần sau thành một câu lệnh in ra dòng chữ Hello.',
                'explanation' => 'Câu lệnh đúng là: print("Hello")',
                'options' => [
                    // Mọi option là một "từ"; slot_index quy định thứ tự đúng.
                    ['content' => 'print', 'is_correct' => true, 'metadata' => ['slot_index' => 0]],
                    ['content' => '(', 'is_correct' => true, 'metadata' => ['slot_index' => 1]],
                    ['content' => '"Hello"', 'is_correct' => true, 'metadata' => ['slot_index' => 2]],
                    ['content' => ')', 'is_correct' => true, 'metadata' => ['slot_index' => 3]],
                ],
            ],
        ];
    }
}
