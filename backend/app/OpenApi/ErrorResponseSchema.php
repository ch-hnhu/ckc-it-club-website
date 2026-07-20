<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ErrorResponse',
    description: 'Envelope chuẩn cho response lỗi',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'Đã xảy ra lỗi.'),
        new OA\Property(
            property: 'errors',
            type: 'object',
            nullable: true,
            example: ['field' => ['Lỗi xác thực dữ liệu.']]
        ),
    ],
    type: 'object'
)]
class ErrorResponseSchema {}
