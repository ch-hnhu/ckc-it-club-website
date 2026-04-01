<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ClubApplication\UpdateClubApplicationStatusRequest;
use App\Models\ClubApplication;
use Illuminate\Http\JsonResponse;

class ClubApplicationController extends BaseApiController
{
    private const STATUS_TRANSITIONS = [
        'pending' => ['processing'],
        'processing' => ['interview'],
        'interview' => ['passed', 'failed'],
        'passed' => [],
        'failed' => [],
    ];

    public function index(): JsonResponse
    {
        $applications = ClubApplication::query()
            ->with([
                'applicant.faculty',
                'applicant.major',
                'applicant.class',
                'answers.question',
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
        $clubApplication->refresh()->load([
            'applicant.faculty',
            'applicant.major',
            'applicant.class',
            'answers.question',
        ]);

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
                return [
                    'id' => $answer->id,
                    'question_id' => $answer->question_id,
                    'question_label' => $answer->question?->label ?? '',
                    'question_type' => $answer->question?->type ?? '',
                    'answer_value' => $answer->answer_value,
                ];
            })->values()->all(),
        ];
    }
}
