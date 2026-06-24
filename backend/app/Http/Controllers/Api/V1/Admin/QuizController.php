<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\QuestionTypeKey;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\QuestionType;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QuizController extends BaseApiController
{
    /**
     * Chi tiết quiz của một buổi học (để prefill trình tạo quiz).
     * Trả về null trong `data` khi buổi học chưa có quiz.
     */
    public function show(Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $quiz = $lesson->quiz()->with('questions.options', 'questions.type')->first();

        return $this->successResponse(
            true,
            $quiz ? $this->transform($quiz) : null,
            ApiMessage::RETRIEVED,
        );
    }

    /**
     * Tạo mới hoặc thay thế toàn bộ nội dung quiz của buổi học.
     * Trình tạo quiz gửi nguyên trạng danh sách câu hỏi nên ta thay thế trọn vẹn
     * (xoá câu hỏi cũ, options tự cascade) trong một transaction.
     */
    public function upsert(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $allowedTypes = QuestionTypeKey::values();
        $typeMap = QuestionType::whereIn('key', $allowedTypes)->pluck('id', 'key'); // key => id
        $data = $this->validateData($request, $allowedTypes);

        $quiz = DB::transaction(function () use ($lesson, $data, $typeMap) {
            $quiz = Quiz::firstOrCreate(['lesson_id' => $lesson->id]);
            $quiz->questions()->delete(); // cascade xoá options

            foreach ($data['questions'] as $qIndex => $q) {
                $metadata = $q['metadata'] ?? [];
                if (! empty($q['ui_type']) && $q['ui_type'] !== $q['type']) {
                    $metadata['ui_type'] = $q['ui_type'];
                }

                $question = $quiz->questions()->create([
                    'question_type_id' => $typeMap[$q['type']],
                    'content' => $q['content'] ?? '',
                    'explanation' => $q['explanation'] ?? null,
                    'image' => $this->persistableImage($q['image'] ?? null),
                    'order' => $qIndex + 1,
                    'metadata' => $metadata ?: null,
                ]);

                foreach ($q['options'] as $oIndex => $opt) {
                    $question->options()->create([
                        'content' => $opt['content'] ?? null,
                        'image' => $this->persistableImage($opt['image'] ?? null),
                        'is_correct' => (bool) ($opt['is_correct'] ?? false),
                        'order' => $oIndex + 1,
                        'metadata' => $opt['metadata'] ?? null,
                    ]);
                }
            }

            return $quiz;
        });

        $quiz->load('questions.options', 'questions.type');

        return $this->successResponse(true, $this->transform($quiz), 'Đã lưu quiz cho buổi học.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function assertBelongsTo(Course $course, Lesson $lesson): void
    {
        abort_if($lesson->course_id !== $course->id, 404, 'Buổi học không thuộc khóa học này.');
    }

    /**
     * @param  array<int,string>  $allowedTypes
     * @return array<string,mixed>
     */
    private function validateData(Request $request, array $allowedTypes): array
    {
        return $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.type' => ['required', 'string', Rule::in($allowedTypes)],
            'questions.*.ui_type' => 'nullable|string|max:50',
            // content cho phép rỗng để lưu bản nháp; tính hoàn thiện được kiểm ở bước Xuất bản (frontend).
            'questions.*.content' => 'nullable|string|max:5000',
            'questions.*.explanation' => 'nullable|string|max:5000',
            'questions.*.image' => 'nullable|string|max:2048',
            'questions.*.metadata' => 'nullable|array',
            'questions.*.options' => 'present|array',
            'questions.*.options.*.content' => 'nullable|string|max:2000',
            'questions.*.options.*.image' => 'nullable|string|max:2048',
            'questions.*.options.*.is_correct' => 'boolean',
            'questions.*.options.*.metadata' => 'nullable|array',
        ]);
    }

    /**
     * Chỉ lưu image là URL thật hoặc đường dẫn nội bộ. Bỏ qua blob:/data:
     * (preview tạm phía client) vì chúng không tồn tại sau khi reload.
     */
    private function persistableImage(?string $image): ?string
    {
        if (! $image) {
            return null;
        }

        return str_starts_with($image, 'http') || str_starts_with($image, '/') ? $image : null;
    }

    /**
     * @return array<string,mixed>
     */
    private function transform(Quiz $quiz): array
    {
        return [
            'id' => $quiz->id,
            'lesson_id' => $quiz->lesson_id,
            'questions' => $quiz->questions->map(function (QuizQuestion $question) {
                $metadata = $question->metadata ?? [];
                $uiType = $metadata['ui_type'] ?? ($question->type?->key);
                unset($metadata['ui_type']);

                return [
                    'id' => $question->id,
                    'type' => $question->type?->key,
                    'ui_type' => $uiType,
                    'content' => $question->content,
                    'explanation' => $question->explanation,
                    'image' => $question->image,
                    'order' => $question->order,
                    'metadata' => $metadata ?: null,
                    'options' => $question->options->map(fn ($option) => [
                        'id' => $option->id,
                        'content' => $option->content,
                        'image' => $option->image,
                        'is_correct' => (bool) $option->is_correct,
                        'order' => $option->order,
                        'metadata' => $option->metadata,
                    ])->all(),
                ];
            })->all(),
        ];
    }
}
