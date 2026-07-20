<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\CourseStatus;
use App\Enums\LessonSectionType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\CourseCompletionService;
use App\Services\CourseEnrollmentService;
use App\Services\PointService;
use App\Services\QuizGradingService;
use App\Traits\HasSequentialLessonLock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class QuizController extends BaseApiController
{
    use HasSequentialLessonLock;

    public function __construct(private readonly QuizGradingService $grader)
    {
        parent::__construct();
    }

    #[OA\Get(
        path: '/v1/learning/courses/{course}/lessons/{lessonSlug}/quiz',
        summary: 'Lấy quiz của buổi học để làm bài (kèm đáp án đúng, chấm chính thức vẫn ở server khi nộp)',
        tags: ['Learning - Courses (User)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, description: 'Slug khoá học', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'lessonSlug', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 403, description: 'Không đủ điều kiện học / buổi học bị khoá hoặc chưa mở', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy buổi học hoặc chưa có quiz', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Lấy quiz để học viên làm bài. Trả về câu hỏi + options (kèm đáp án đúng
     * để client cho phản hồi tức thì kiểu Duolingo). Điểm vẫn do server chấm khi nộp.
     */
    public function show(Request $request, Course $course, string $lessonSlug): JsonResponse
    {
        [$lesson, $lessons] = $this->resolveLessonWithSiblings($course, $lessonSlug);
        app(CourseEnrollmentService::class)->assertCanLearn($course, auth('sanctum')->user());
        $this->assertLessonContentOpen($lesson);

        $userId = auth('sanctum')->id();
        $enrollment = $course->enrollmentFor($userId);
        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $enrollment?->track);
        abort_if(
            in_array($lesson->id, $lockedIds, true),
            403,
            'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.'
        );

        $quiz = $lesson->quiz()->where('is_published', true)->with(['questions.options', 'questions.type'])->first();

        abort_if(! $quiz || $quiz->questions->isEmpty(), 404, 'Buổi học này chưa có quiz.');

        $completed = $userId
            ? $lesson->progress()
                ->where('user_id', $userId)
                ->where('section_type', LessonSectionType::QUIZ->value)
                ->where('is_completed', true)
                ->exists()
            : false;

        $data = [
            'quiz_id' => $quiz->id,
            'pass_threshold' => (int) $course->quiz_pass_threshold,
            'completed' => $completed,
            'course' => ['slug' => $course->slug, 'title' => $course->title],
            'lesson' => ['slug' => $lesson->slug, 'title' => $lesson->title, 'order' => $lesson->order],
            'questions' => $quiz->questions->map(function ($question) {
                $metadata = $question->metadata ?? [];
                $uiType = $metadata['ui_type'] ?? $question->type?->key;

                return [
                    'id' => $question->id,
                    'type' => $question->type?->key,
                    'ui_type' => $uiType,
                    'content' => $question->content,
                    'explanation' => $question->explanation,
                    'image' => $question->image,
                    'options' => $question->options->map(fn ($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'image' => $o->image,
                        'is_correct' => (bool) $o->is_correct,
                        'order' => $o->order,
                        'metadata' => $o->metadata,
                    ])->all(),
                ];
            })->all(),
        ];

        return $this->successResponse(true, $data, 'Lấy quiz thành công.');
    }

    #[OA\Post(
        path: '/v1/learning/courses/{course}/lessons/{lessonSlug}/quiz/submit',
        summary: 'Nộp bài quiz — server chấm lại toàn bộ, ghi nhận lượt làm và cập nhật tiến độ',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (User)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, description: 'Slug khoá học', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'lessonSlug', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['answers'],
                properties: [
                    new OA\Property(
                        property: 'answers',
                        type: 'array',
                        items: new OA\Items(properties: [
                            new OA\Property(property: 'question_id', type: 'integer'),
                            new OA\Property(property: 'answer_data', type: 'array', items: new OA\Items()),
                        ])
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Đã chấm bài (dù đạt hay không đều trả 200)',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'score', type: 'number', format: 'float'),
                        new OA\Property(property: 'is_passed', type: 'boolean'),
                        new OA\Property(property: 'pass_threshold', type: 'integer'),
                        new OA\Property(property: 'correct_count', type: 'integer'),
                        new OA\Property(property: 'total', type: 'integer'),
                        new OA\Property(property: 'results', type: 'array', items: new OA\Items(properties: [
                            new OA\Property(property: 'question_id', type: 'integer'),
                            new OA\Property(property: 'is_correct', type: 'boolean'),
                        ])),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 403, description: 'Không đủ điều kiện học / buổi học bị khoá hoặc chưa mở', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy buổi học hoặc chưa có quiz', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    /**
     * Nộp bài quiz: server chấm lại toàn bộ, ghi nhận lượt làm + đáp án,
     * cập nhật tiến độ phần quiz của buổi học, trả về kết quả.
     */
    public function submit(Request $request, Course $course, string $lessonSlug): JsonResponse
    {
        [$lesson, $lessons] = $this->resolveLessonWithSiblings($course, $lessonSlug);
        app(CourseEnrollmentService::class)->assertCanLearn($course, $request->user());
        $this->assertLessonContentOpen($lesson);

        $userId = $request->user()->id;
        $enrollment = $course->enrollmentFor($userId);
        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $enrollment?->track);
        abort_if(
            in_array($lesson->id, $lockedIds, true),
            403,
            'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.'
        );

        $quiz = $lesson->quiz()->where('is_published', true)->with(['questions.options', 'questions.type'])->first();
        abort_if(! $quiz || $quiz->questions->isEmpty(), 404, 'Buổi học này chưa có quiz.');

        $validated = $request->validate([
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer_data' => 'present|array',
        ]);

        $questionsById = $quiz->questions->keyBy('id');
        $total = $quiz->questions->count();

        // Chỉ giữ câu trả lời thuộc quiz này, mỗi câu một lần (lần cuối thắng).
        $answers = collect($validated['answers'])
            ->filter(fn ($a) => $questionsById->has($a['question_id']))
            ->keyBy('question_id');

        $graded = $answers->map(function ($answer) use ($questionsById) {
            $question = $questionsById->get($answer['question_id']);

            return [
                'question_id' => (int) $answer['question_id'],
                'answer_data' => $answer['answer_data'],
                'is_correct' => $this->grader->isCorrect($question, $answer['answer_data']),
            ];
        })->values();

        $correctCount = $graded->where('is_correct', true)->count();
        $score = $total > 0 ? round($correctCount / $total * 100, 2) : 0.0;
        $threshold = (int) $course->quiz_pass_threshold;
        $isPassed = $score >= $threshold;

        $quizProgress = null;
        $wasQuizCompleted = false;

        DB::transaction(function () use ($quiz, $userId, $score, $isPassed, $graded, $lesson, &$quizProgress, &$wasQuizCompleted) {
            $attempt = QuizAttempt::create([
                'user_id' => $userId,
                'quiz_id' => $quiz->id,
                'score' => $score,
                'is_passed' => $isPassed,
                'started_at' => now(),
                'finished_at' => now(),
                'is_review' => false,
            ]);

            foreach ($graded as $g) {
                $attempt->answers()->create([
                    'question_id' => $g['question_id'],
                    'answer_data' => $g['answer_data'],
                    'is_correct' => $g['is_correct'],
                ]);
            }

            // Tiến độ phần quiz: hoàn thành một lần đạt là "dính"; giữ điểm cao nhất.
            $existing = LessonProgress::where('user_id', $userId)
                ->where('lesson_id', $lesson->id)
                ->where('section_type', LessonSectionType::QUIZ->value)
                ->first();

            $completed = $isPassed || (bool) ($existing?->is_completed);
            $bestScore = max((float) $score, (float) ($existing?->score ?? 0));
            $wasQuizCompleted = (bool) ($existing?->is_completed);

            $quizProgress = LessonProgress::updateOrCreate(
                [
                    'user_id' => $userId,
                    'lesson_id' => $lesson->id,
                    'section_type' => LessonSectionType::QUIZ->value,
                ],
                [
                    'is_completed' => $completed,
                    'score' => $bestScore,
                    'completed_at' => $completed ? ($existing?->completed_at ?? now()) : null,
                ],
            );
        });

        if (! $wasQuizCompleted && $quizProgress?->is_completed) {
            PointService::award($request->user(), 'learning_center.quiz_passed', $quizProgress);
        }

        // Làm quiz cũng là học → tự ghi danh (track online) nếu chưa, để tính tiến độ.
        $enrollment = app(CourseEnrollmentService::class)->ensureEnrolledOnline($course, $request->user());
        app(CourseCompletionService::class)->recalc($enrollment);

        return $this->successResponse(true, [
            'score' => $score,
            'is_passed' => $isPassed,
            'pass_threshold' => $threshold,
            'correct_count' => $correctCount,
            'total' => $total,
            'results' => $graded->map(fn ($g) => [
                'question_id' => $g['question_id'],
                'is_correct' => $g['is_correct'],
            ])->all(),
        ], $isPassed ? 'Chúc mừng, bạn đã vượt qua quiz!' : 'Bạn chưa đạt, hãy thử lại nhé.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * @return array{0: Lesson, 1: \Illuminate\Support\Collection<int,Lesson>}
     */
    private function resolveLessonWithSiblings(Course $course, string $lessonSlug): array
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $lessons = $course->lessons()
            ->where('status', CourseStatus::PUBLISHED->value)
            ->get();

        $lesson = $lessons->first(fn (Lesson $l) => $l->slug === $lessonSlug);
        abort_if(! $lesson, 404, 'Không tìm thấy buổi học.');

        return [$lesson, $lessons];
    }

    private function assertLessonContentOpen(Lesson $lesson): void
    {
        if ($lesson->session_start && now()->lt($lesson->session_start)) {
            abort(403, 'Buổi học chưa bắt đầu. Vui lòng quay lại vào ngày ' . $lesson->session_start->format('d/m/Y') . '.');
        }
    }
}
