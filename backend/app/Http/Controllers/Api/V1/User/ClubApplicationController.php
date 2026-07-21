<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\ApplicationAnswer;
use App\Models\ApplicationQuestion;
use App\Models\ClubApplication;
use App\Models\ClubInformation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ClubApplicationController extends BaseApiController
{
    #[OA\Get(
        path: '/v1/user/application-questions',
        summary: 'Lấy danh sách câu hỏi đơn xin gia nhập CLB đang active (để render form đăng ký)',
        security: [['sanctum' => []]],
        tags: ['Club Application'],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
    public function questions(): JsonResponse
    {
        $questions = ApplicationQuestion::query()
            ->where('is_active', true)
            ->with('options')
            ->orderBy('order_index')
            ->get()
            ->map(fn (ApplicationQuestion $q) => [
                'id' => $q->id,
                'label' => $q->label,
                'type' => $q->type,
                'is_required' => $q->is_required,
                'is_active' => $q->is_active,
                'order_index' => $q->order_index,
                'options' => $q->options->map(fn ($o) => [
                    'id' => $o->id,
                    'value' => $o->value,
                    'label' => $o->label,
                ])->values()->all(),
            ]);

        return $this->successResponse(true, $questions, 'Questions retrieved successfully', HttpStatus::OK);
    }

    #[OA\Get(
        path: '/v1/user/club-applications/me',
        summary: 'Lấy đơn xin gia nhập CLB mới nhất mà user hiện tại đã nộp',
        security: [['sanctum' => []]],
        tags: ['Club Application'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'id', type: 'integer'),
                        new OA\Property(property: 'status', type: 'string', enum: ['pending', 'processing', 'interview', 'passed', 'failed']),
                        new OA\Property(property: 'note', type: 'string', nullable: true),
                        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 404, description: 'Chưa nộp đơn nào', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function myApplication(): JsonResponse
    {
        $application = ClubApplication::where('created_by', auth()->id())
            ->latest()
            ->first();

        if (!$application) {
            return $this->notFoundResponse('No application found');
        }

        return $this->successResponse(true, [
            'id' => $application->id,
            'status' => $application->status,
            'note' => $application->note,
            'created_at' => $application->created_at?->toISOString(),
        ], 'Application retrieved successfully', HttpStatus::OK);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private function isRecruitmentEnabled(): bool
    {
        $info = ClubInformation::where('slug', 'recruitment-enabled')->first();
        $value = $info?->clubInformationValues()->where('is_active', true)->value('value');
        return ($value ?? 'true') === 'true';
    }

    #[OA\Post(
        path: '/v1/user/club-applications',
        summary: 'Nộp đơn xin gia nhập CLB (mỗi user chỉ nộp được 1 lần)',
        security: [['sanctum' => []]],
        tags: ['Club Application'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'answers',
                        type: 'array',
                        items: new OA\Items(properties: [
                            new OA\Property(property: 'question_id', type: 'integer'),
                            new OA\Property(property: 'answer_value', type: 'string'),
                        ])
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Nộp đơn thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'id', type: 'integer'),
                        new OA\Property(property: 'status', type: 'string', example: 'pending'),
                        new OA\Property(property: 'note', type: 'string', nullable: true),
                        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 403, description: 'Form đăng ký tạm thời đã đóng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Đã nộp đơn trước đó hoặc thiếu câu trả lời bắt buộc', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        if (! $this->isRecruitmentEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Form đăng ký tạm thời đã đóng.',
            ], 403);
        }

        $userId = auth()->id();

        $existing = ClubApplication::where('created_by', $userId)->exists();
        if ($existing) {
            return $this->validationErrorResponse(
                ['application' => ['Bạn đã nộp đơn ứng tuyển trước đó.']],
                'Duplicate application'
            );
        }

        $answers = $request->input('answers', []);

        $requiredIds = ApplicationQuestion::where('is_required', true)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        $answeredIds = collect($answers)
            ->filter(fn ($a) => !empty($a['answer_value']))
            ->pluck('question_id')
            ->toArray();

        $missing = array_diff($requiredIds, $answeredIds);
        if (!empty($missing)) {
            return $this->validationErrorResponse(
                ['answers' => ['Vui lòng điền đầy đủ các câu hỏi bắt buộc.']],
                'Missing required answers'
            );
        }

        $application = ClubApplication::create([
            'status' => 'pending',
            'note' => null,
            'created_by' => $userId,
        ]);

        foreach ($answers as $answer) {
            if (!empty($answer['question_id']) && isset($answer['answer_value'])) {
                $record = new ApplicationAnswer();
                $record->application_id = $application->id;
                $record->question_id = $answer['question_id'];
                $record->answer_value = $answer['answer_value'];
                $record->save();
            }
        }

        return $this->createdResponse([
            'id' => $application->id,
            'status' => $application->status,
            'note' => $application->note,
            'created_at' => $application->created_at?->toISOString(),
        ], 'Application submitted successfully');
    }
}
