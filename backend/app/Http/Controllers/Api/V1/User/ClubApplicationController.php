<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\ApplicationAnswer;
use App\Models\ApplicationQuestion;
use App\Models\ClubApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubApplicationController extends BaseApiController
{
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

    public function store(Request $request): JsonResponse
    {
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
