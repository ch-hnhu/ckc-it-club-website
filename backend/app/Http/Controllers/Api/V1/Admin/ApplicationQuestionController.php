<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ApplicationQuestion\ReorderApplicationQuestionRequest;
use App\Http\Requests\Api\V1\ApplicationQuestion\StoreApplicationQuestionRequest;
use App\Http\Requests\Api\V1\ApplicationQuestion\UpdateApplicationQuestionRequest;
use App\Models\ApplicationQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ApplicationQuestionController extends BaseApiController
{
    public function index(): JsonResponse
    {
        return $this->successResponse(
            true,
            $this->listQuestions(),
            'Application questions retrieved successfully',
            HttpStatus::OK
        );
    }

    public function show(ApplicationQuestion $applicationQuestion): JsonResponse
    {
        $applicationQuestion->load([
            'options' => fn ($query) => $query->orderBy('id'),
        ])->loadCount('answers');

        return $this->successResponse(
            true,
            $this->transformQuestion($applicationQuestion),
            'Application question retrieved successfully',
            HttpStatus::OK
        );
    }

    public function store(StoreApplicationQuestionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $question = DB::transaction(function () use ($validated) {
            $userId = auth()->id();
            $now = now();

            $question = ApplicationQuestion::create([
                'label' => $validated['label'],
                'type' => $validated['type'],
                'is_required' => $validated['is_required'],
                'order_index' => ((int) ApplicationQuestion::max('order_index')) + 1,
                'is_active' => $validated['is_active'],
                'created_at' => $now,
                'created_by' => $userId,
                'updated_at' => $now,
                'updated_by' => $userId,
            ]);

            $this->syncOptions($question, $validated['options'] ?? [], $userId, $now);

            return $question->load([
                'options' => fn ($query) => $query->orderBy('id'),
            ])->loadCount('answers');
        });

        return $this->createdResponse(
            $this->transformQuestion($question),
            'Application question created successfully'
        );
    }

    public function update(
        UpdateApplicationQuestionRequest $request,
        ApplicationQuestion $applicationQuestion
    ): JsonResponse {
        $validated = $request->validated();

        if (
            $applicationQuestion->answers()->exists() &&
            $applicationQuestion->type !== $validated['type']
        ) {
            return $this->validationErrorResponse([
                'type' => ['Không thể thay đổi loại câu hỏi đã có câu trả lời.'],
            ], 'Question type cannot be changed once answers exist');
        }

        $question = DB::transaction(function () use ($applicationQuestion, $validated) {
            $userId = auth()->id();
            $now = now();

            $applicationQuestion->fill([
                'label' => $validated['label'],
                'type' => $validated['type'],
                'is_required' => $validated['is_required'],
                'is_active' => $validated['is_active'],
                'updated_at' => $now,
                'updated_by' => $userId,
            ]);
            $applicationQuestion->save();

            $this->syncOptions($applicationQuestion, $validated['options'] ?? [], $userId, $now);

            return $applicationQuestion->load([
                'options' => fn ($query) => $query->orderBy('id'),
            ])->loadCount('answers');
        });

        return $this->successResponse(
            true,
            $this->transformQuestion($question),
            'Application question updated successfully',
            HttpStatus::OK
        );
    }

    public function reorder(ReorderApplicationQuestionRequest $request): JsonResponse
    {
        $orderedIds = $request->validated()['question_ids'];
        $currentIds = ApplicationQuestion::query()
            ->orderBy('order_index')
            ->pluck('id')
            ->all();

        $remainingIds = array_values(array_diff($currentIds, $orderedIds));
        $finalIds = array_values(array_merge($orderedIds, $remainingIds));

        DB::transaction(function () use ($finalIds) {
            $userId = auth()->id();
            $now = now();

            foreach ($finalIds as $index => $questionId) {
                ApplicationQuestion::query()
                    ->where('id', $questionId)
                    ->update([
                        'order_index' => $index + 1,
                        'updated_at' => $now,
                        'updated_by' => $userId,
                    ]);
            }
        });

        return $this->successResponse(
            true,
            $this->listQuestions(),
            'Application questions reordered successfully',
            HttpStatus::OK
        );
    }

    public function destroy(ApplicationQuestion $applicationQuestion): JsonResponse
    {
        if ($applicationQuestion->answers()->exists()) {
            return $this->validationErrorResponse([
                'question' => ['Không thể xóa câu hỏi đã có câu trả lời. Hãy chuyển về trạng thái ẩn.'],
            ], 'Question cannot be deleted because answers already exist');
        }

        $deletedId = $applicationQuestion->id;

        DB::transaction(function () use ($applicationQuestion) {
            $applicationQuestion->options()->delete();
            $applicationQuestion->delete();
            $this->reindexQuestions();
        });

        return $this->successResponse(
            true,
            ['id' => $deletedId],
            'Application question deleted successfully',
            HttpStatus::OK
        );
    }

    private function syncOptions(
        ApplicationQuestion $question,
        array $options,
        ?int $userId,
        $now
    ): void {
        if (!in_array($question->type, ['radio', 'select'], true)) {
            $question->options()->delete();
            return;
        }

        $existingOptions = $question->options()->get()->keyBy('id');
        $keptIds = [];

        foreach ($options as $optionData) {
            $optionId = $optionData['id'] ?? null;

            if ($optionId && $existingOptions->has($optionId)) {
                $option = $existingOptions->get($optionId);
                $option->fill([
                    'value' => $optionData['value'],
                    'label' => $optionData['label'],
                    'updated_at' => $now,
                    'updated_by' => $userId,
                ]);
                $option->save();
                $keptIds[] = $option->id;
                continue;
            }

            $newOption = $question->options()->create([
                'value' => $optionData['value'],
                'label' => $optionData['label'],
                'created_at' => $now,
                'created_by' => $userId,
                'updated_at' => $now,
                'updated_by' => $userId,
            ]);
            $keptIds[] = $newOption->id;
        }

        $question->options()
            ->whereNotIn('id', $keptIds)
            ->delete();
    }

    private function reindexQuestions(): void
    {
        $userId = auth()->id();
        $now = now();
        $ids = ApplicationQuestion::query()
            ->orderBy('order_index')
            ->pluck('id')
            ->all();

        foreach ($ids as $index => $questionId) {
            ApplicationQuestion::query()
                ->where('id', $questionId)
                ->update([
                    'order_index' => $index + 1,
                    'updated_at' => $now,
                    'updated_by' => $userId,
                ]);
        }
    }

    private function listQuestions(): array
    {
        return ApplicationQuestion::query()
            ->with([
                'options' => fn ($query) => $query->orderBy('id'),
            ])
            ->withCount('answers')
            ->orderBy('order_index')
            ->get()
            ->map(fn (ApplicationQuestion $question) => $this->transformQuestion($question))
            ->values()
            ->all();
    }

    private function transformQuestion(ApplicationQuestion $question): array
    {
        return [
            'id' => $question->id,
            'label' => $question->label,
            'type' => $question->type,
            'is_required' => (bool) $question->is_required,
            'order_index' => (int) $question->order_index,
            'is_active' => (bool) $question->is_active,
            'created_at' => $question->created_at?->toISOString(),
            'created_by' => $question->created_by,
            'updated_at' => $question->updated_at?->toISOString(),
            'updated_by' => $question->updated_by,
            'answers_count' => (int) ($question->answers_count ?? 0),
            'options' => $question->options
                ->map(fn ($option) => [
                    'id' => $option->id,
                    'question_id' => $option->question_id,
                    'value' => $option->value,
                    'label' => $option->label,
                ])
                ->values()
                ->all(),
        ];
    }
}
