<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PaginationMeta',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'last_page', type: 'integer', example: 5),
        new OA\Property(property: 'per_page', type: 'integer', example: 15),
        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 15),
        new OA\Property(property: 'total', type: 'integer', example: 68),
    ],
    type: 'object'
)]
class PaginationMetaSchema {}
