<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SuccessResponse',
    description: 'Envelope chuẩn cho response thành công',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Thao tác thành công.'),
        new OA\Property(property: 'data', type: 'object', nullable: true),
    ],
    type: 'object'
)]
class SuccessResponseSchema {}
