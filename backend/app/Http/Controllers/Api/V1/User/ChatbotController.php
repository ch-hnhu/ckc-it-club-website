<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Chatbot\ChatRequest;
use App\Services\ChatbotService;
use Illuminate\Http\JsonResponse;

class ChatbotController extends BaseApiController
{
    public function __construct(private readonly ChatbotService $chatbot)
    {
        parent::__construct();
    }

    /**
     * Hỏi đáp với trợ lý ảo của câu lạc bộ.
     */
    public function ask(ChatRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $answer = $this->chatbot->ask(
                $validated['message'],
                $validated['history'] ?? []
            );
        } catch (\RuntimeException $e) {
            return $this->errorResponse(false, $e->getMessage(), 503);
        }

        return $this->successResponse(true, ['answer' => $answer], 'Trả lời thành công.');
    }
}
