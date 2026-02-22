<?php

namespace App\Exceptions;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $e)
    {
        // Handle API requests with JSON responses
        if ($request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Illuminate\Http\JsonResponse
     */
    private function handleApiException($request, Throwable $e)
    {
        $statusCode = HttpStatus::INTERNAL_SERVER_ERROR;
        $message = ApiMessage::SERVER_ERROR;
        $errors = null;

        if ($e instanceof ValidationException) {
            $statusCode = HttpStatus::UNPROCESSABLE_ENTITY;
            $message = ApiMessage::VALIDATION_ERROR;
            $errors = $e->errors();
        } elseif ($e instanceof AuthenticationException) {
            $statusCode = HttpStatus::UNAUTHORIZED;
            $message = ApiMessage::UNAUTHORIZED;
        } elseif ($e instanceof NotFoundHttpException) {
            $statusCode = HttpStatus::NOT_FOUND;
            $message = ApiMessage::NOT_FOUND;
        } elseif ($e instanceof MethodNotAllowedHttpException) {
            $statusCode = HttpStatus::METHOD_NOT_ALLOWED;
            $message = ApiMessage::ERROR;
        } elseif (method_exists($e, 'getStatusCode')) {
            $statusCode = HttpStatus::tryFrom($e->getStatusCode()) ?? HttpStatus::INTERNAL_SERVER_ERROR;
            $message = $e->getMessage() ?: ApiMessage::ERROR;
        } elseif ($e->getMessage()) {
            $message = $e->getMessage();
        }

        $response = [
            'success' => false,
            'message' => $message instanceof ApiMessage ? $message->value : $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        // Include trace in development mode
        if (config('app.debug')) {
            $response['debug'] = [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => collect($e->getTrace())->take(5)->toArray(), // Limit trace to 5 items
            ];
        }

        return response()->json($response, $statusCode instanceof HttpStatus ? $statusCode->value : $statusCode);
    }
}
