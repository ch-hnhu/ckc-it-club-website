<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends BaseApiController
{
    public function toggle(Request $request, string $username): JsonResponse
    {
        $target = User::where('username', $username)
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

    public function followers(string $username): JsonResponse
    {
        $user = User::where('username', $username)->where('is_active', true)->first();

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

    public function following(string $username): JsonResponse
    {
        $user = User::where('username', $username)->where('is_active', true)->first();

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
