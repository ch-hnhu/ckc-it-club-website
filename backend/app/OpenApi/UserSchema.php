<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'username', type: 'string', example: 'nguyenvana'),
        new OA\Property(property: 'full_name', type: 'string', example: 'Nguyễn Văn A'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'a@student.ckc.edu.vn'),
        new OA\Property(property: 'avatar_url', type: 'string', nullable: true, example: 'https://.../avatar.jpg'),
        new OA\Property(property: 'bio', type: 'string', nullable: true),
        new OA\Property(property: 'phone', type: 'string', nullable: true),
        new OA\Property(property: 'is_school_student', type: 'boolean', example: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class UserSchema {}
