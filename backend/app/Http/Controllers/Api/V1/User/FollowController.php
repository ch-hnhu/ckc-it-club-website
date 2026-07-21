<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class FollowController extends BaseApiController
{
    #[OA\Post(
        path: '/v1/users/{username}/follow',
        summary: 'Theo dõi / bỏ theo dõi một user (toggle)',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'is_following', type: 'boolean'),
                        new OA\Property(property: 'followers_count', type: 'integer'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 404, description: 'Không tìm thấy người dùng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Không thể theo dõi chính mình', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function toggle(Request $request, string $username): JsonResponse
    {
        $target = User::where(function ($q) use ($username) {
                $q->where('username', $username)
                  ->orWhere('email', 'like', "{$username}@%");
            })
            ->where('is_active', true)
            ->first();

        if (! $target) {
            return $this->errorResponse(false, 'Không tìm thấy người dùng.', HttpStatus::NOT_FOUND);
        }

        $me = $request->user();

        if ($target->id === $me->id) {
            return $this->errorResponse(false, 'Không thể theo dõi chính mình.', HttpStatus::UNPROCESSABLE_ENTITY);
        }

        $me->following()->toggle($target->id);

        $isFollowing = $me->following()->where('following_id', $target->id)->exists();
        $followersCount = $target->followers()->count();

        if ($isFollowing) {
            UserNotificationService::dispatchFollow($target, $me);
        }

        return $this->successResponse(true, [
            'is_following'    => $isFollowing,
            'followers_count' => $followersCount,
        ], $isFollowing ? 'Đã theo dõi.' : 'Đã bỏ theo dõi.');
    }

    #[OA\Get(
        path: '/v1/users/{username}/followers',
        summary: 'Danh sách người theo dõi một user (public)',
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy người dùng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function followers(string $username): JsonResponse
    {
        $user = User::where(function ($q) use ($username) {
                $q->where('username', $username)
                  ->orWhere('email', 'like', "{$username}@%");
            })
            ->where('is_active', true)
            ->first();

        if (! $user) {
            return $this->errorResponse(false, 'Không tìm thấy người dùng.', HttpStatus::NOT_FOUND);
        }

        $followers = $user->followers()
            ->select(['users.id', 'users.full_name', 'users.username', 'users.avatar', 'users.bio'])
            ->get()
            ->map(fn (User $u) => [
                'id'        => $u->id,
                'full_name' => $u->full_name,
                'username'  => $u->username,
                'avatar'    => $u->avatar,
                'bio'       => $u->bio,
            ]);

        return $this->successResponse(true, $followers, 'Lấy danh sách người theo dõi thành công.');
    }

    #[OA\Get(
        path: '/v1/users/{username}/following',
        summary: 'Danh sách người mà một user đang theo dõi (public)',
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy người dùng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function following(string $username): JsonResponse
    {
        $user = User::where(function ($q) use ($username) {
                $q->where('username', $username)
                  ->orWhere('email', 'like', "{$username}@%");
            })
            ->where('is_active', true)
            ->first();

        if (! $user) {
            return $this->errorResponse(false, 'Không tìm thấy người dùng.', HttpStatus::NOT_FOUND);
        }

        $following = $user->following()
            ->select(['users.id', 'users.full_name', 'users.username', 'users.avatar', 'users.bio'])
            ->get()
            ->map(fn (User $u) => [
                'id'        => $u->id,
                'full_name' => $u->full_name,
                'username'  => $u->username,
                'avatar'    => $u->avatar,
                'bio'       => $u->bio,
            ]);

        return $this->successResponse(true, $following, 'Lấy danh sách đang theo dõi thành công.');
    }
}
