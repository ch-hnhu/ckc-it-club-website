<?php

namespace App\Traits;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Success response
     *
     * @param mixed $data
     * @param ApiMessage|string|null $message
     * @param HttpStatus|int|null $code
     * @return JsonResponse
     */
    protected function successResponse(
        $data = null,
        ApiMessage|string|null $message = null,
        HttpStatus|int|null $code = null
    ): JsonResponse {
        $statusCode = $code instanceof HttpStatus ? $code->value : ($code ?? HttpStatus::OK->value);
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::SUCCESS->translate());

        return response()->json([
            'success' => true,
            'message' => $messageText,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Error response
     *
     * @param ApiMessage|string|null $message
     * @param HttpStatus|int|null $code
     * @param mixed $errors
     * @return JsonResponse
     */
    protected function errorResponse(
        ApiMessage|string|null $message = null,
        HttpStatus|int|null $code = null,
        $errors = null
    ): JsonResponse {
        $statusCode = $code instanceof HttpStatus ? $code->value : ($code ?? HttpStatus::BAD_REQUEST->value);
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::ERROR->translate());

        $response = [
            'success' => false,
            'message' => $messageText,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Paginated response
     *
     * @param mixed $data
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function paginatedResponse($data, ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::SUCCESS->translate());

        return response()->json([
            'success' => true,
            'message' => $messageText,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'from' => $data->firstItem(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'to' => $data->lastItem(),
                'total' => $data->total(),
            ],
            'links' => [
                'first' => $data->url(1),
                'last' => $data->url($data->lastPage()),
                'prev' => $data->previousPageUrl(),
                'next' => $data->nextPageUrl(),
            ],
        ], HttpStatus::OK->value);
    }

    /**
     * Created response
     *
     * @param mixed $data
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function createdResponse($data = null, ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::CREATED->translate());
        return $this->successResponse($data, $messageText, HttpStatus::CREATED);
    }

    /**
     * No content response
     *
     * @return JsonResponse
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, HttpStatus::NO_CONTENT->value);
    }

    /**
     * Not found response
     *
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function notFoundResponse(ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::NOT_FOUND->translate());
        return $this->errorResponse($messageText, HttpStatus::NOT_FOUND);
    }

    /**
     * Validation error response
     *
     * @param mixed $errors
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function validationErrorResponse($errors, ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::VALIDATION_ERROR->translate());
        return $this->errorResponse($messageText, HttpStatus::UNPROCESSABLE_ENTITY, $errors);
    }

    /**
     * Unauthorized response
     *
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function unauthorizedResponse(ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::UNAUTHORIZED->translate());
        return $this->errorResponse($messageText, HttpStatus::UNAUTHORIZED);
    }

    /**
     * Forbidden response
     *
     * @param ApiMessage|string|null $message
     * @return JsonResponse
     */
    protected function forbiddenResponse(ApiMessage|string|null $message = null): JsonResponse
    {
        $messageText = $message instanceof ApiMessage ? $message->translate() : ($message ?? ApiMessage::FORBIDDEN->translate());
        return $this->errorResponse($messageText, HttpStatus::FORBIDDEN);
    }
}

