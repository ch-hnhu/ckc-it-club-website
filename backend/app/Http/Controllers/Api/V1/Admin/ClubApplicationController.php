<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\HttpStatus;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ClubApplication\UpdateClubApplicationStatusRequest;
use App\Models\ClubApplication;
use App\Services\ApplicationEmailService;
use App\Services\NotificationService;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ClubApplicationController extends BaseApiController
{
    private const STATUS_TRANSITIONS = [
        'pending' => ['processing'],
        'processing' => ['interview', 'failed'],
        'interview' => ['passed', 'failed'],
        'passed' => [],
        'failed' => [],
    ];

    #[OA\Get(
        path: '/v1/club-applications',
        summary: '[Admin] Danh sách toàn bộ đơn xin gia nhập CLB (kèm câu trả lời)',
        description: 'Yêu cầu quyền applications.view.',
        security: [['sanctum' => []]],
        tags: ['Club Application'],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 403, description: 'Không có quyền', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function index(): JsonResponse
    {
        $applications = ClubApplication::query()
            ->with([
                'applicant.faculty',
                'applicant.major',
                'applicant.class',
                'answers.question.options',
            ])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (ClubApplication $application) => $this->transformApplication($application));

        return $this->successResponse(
            true,
            $applications,
            'Applications retrieved successfully',
            HttpStatus::OK
        );
    }

    #[OA\Patch(
        path: '/v1/club-applications/{clubApplication}/status',
        summary: '[Admin] Cập nhật trạng thái đơn xin gia nhập (theo luồng chuyển trạng thái cố định)',
        description: 'Yêu cầu quyền applications.manage. Luồng chuyển hợp lệ: pending→processing, processing→interview|failed, interview→passed|failed. Khi chuyển sang "passed", user sẽ được gán role club_member.',
        security: [['sanctum' => []]],
        tags: ['Club Application'],
        parameters: [
            new OA\Parameter(name: 'clubApplication', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['processing', 'interview', 'passed', 'failed']),
                    new OA\Property(property: 'note', type: 'string', maxLength: 255, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Cập nhật thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 403, description: 'Không có quyền', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Chuyển trạng thái không hợp lệ / lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function updateStatus(
        UpdateClubApplicationStatusRequest $request,
        ClubApplication $clubApplication
    ): JsonResponse {
        $validated = $request->validated();
        $nextStatus = $validated['status'];
        $allowedTransitions = self::STATUS_TRANSITIONS[$clubApplication->status] ?? [];

        if (!in_array($nextStatus, $allowedTransitions, true)) {
            return $this->validationErrorResponse([
                'status' => [
                    sprintf(
                        'Trạng thái "%s" chỉ có thể chuyển sang: %s.',
                        $clubApplication->status,
                        empty($allowedTransitions) ? 'không có trạng thái tiếp theo' : implode(', ', $allowedTransitions)
                    ),
                ],
            ], 'Invalid application status transition');
        }

        $clubApplication->status = $nextStatus;
        $clubApplication->note = array_key_exists('note', $validated)
            ? ($validated['note'] !== '' ? $validated['note'] : null)
            : $clubApplication->note;
        $clubApplication->updated_by = auth()->id();
        $clubApplication->save();

        if ($nextStatus === 'passed' && $clubApplication->applicant) {
            $clubApplication->applicant->syncRoles([RolesEnum::CLUB_MEMBER->value]);
        }

        $clubApplication->refresh()->load([
            'applicant.faculty',
            'applicant.major',
            'applicant.class',
            'answers.question',
        ]);

        $admin = auth()->user();
        $statusLabels = [
            'processing' => 'Đang xử lý',
            'interview' => 'Phỏng vấn',
            'passed' => 'Đạt',
            'failed' => 'Không đạt',
        ];
        $applicantName = $clubApplication->applicant?->full_name ?? 'ứng viên';
        NotificationService::dispatch(
            'Cập nhật trạng thái đơn xét tuyển',
            ($admin?->full_name ?? 'Admin') . ' đã chuyển đơn của ' . $applicantName . ' sang "' . ($statusLabels[$nextStatus] ?? $nextStatus) . '"',
            'status_changed',
            'club_application',
            $clubApplication->id,
            $admin?->full_name ?? 'Admin',
            '/requests/' . $clubApplication->id,
        );

        if ($admin && $clubApplication->applicant) {
            UserNotificationService::dispatchApplicationStatusUpdate(
                $clubApplication->applicant,
                $admin,
                $nextStatus,
                $clubApplication->id,
            );

            ApplicationEmailService::send($clubApplication->applicant, $nextStatus, $clubApplication->id);
        }

        return $this->successResponse(
            true,
            $this->transformApplication($clubApplication),
            'Application status updated successfully',
            HttpStatus::OK
        );
    }

    private function transformApplication(ClubApplication $application): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'note' => $application->note,
            'created_at' => $application->created_at?->toISOString(),
            'updated_at' => $application->updated_at?->toISOString(),
            'created_by' => $application->created_by,
            'updated_by' => $application->updated_by,
            'applicant' => $application->applicant ? [
                'id' => $application->applicant->id,
                'full_name' => $application->applicant->full_name,
                'email' => $application->applicant->email,
                'student_code' => $application->applicant->student_code,
                'faculty' => $application->applicant->faculty?->label,
                'major' => $application->applicant->major?->label,
                'class_name' => $application->applicant->class?->label,
            ] : null,
            'answers' => $application->answers->map(function ($answer) {
                $type  = $answer->question?->type ?? '';
                $value = $answer->answer_value;

                $label = in_array($type, ['radio', 'select']) && $value && $answer->question
                    ? ($answer->question->options->firstWhere('value', $value)?->label ?? $value)
                    : $value;

                return [
                    'id'             => $answer->id,
                    'question_id'    => $answer->question_id,
                    'question_label' => $answer->question?->label ?? '',
                    'question_type'  => $type,
                    'answer_value'   => $value,
                    'answer_label'   => $label,
                ];
            })->values()->all(),
        ];
    }
}
