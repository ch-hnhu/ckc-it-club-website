<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserNotificationController extends BaseApiController
{
	public function index(Request $request): JsonResponse
	{
		$user = Auth::user();
		$page = max(1, (int) $request->query('page', 1));
		$perPage = min(50, max(1, (int) $request->query('per_page', 20)));

		$paginated = $user->notifications()
			->where('type', \App\Notifications\UserCommunityNotification::class)
			->latest()
			->paginate($perPage, ['*'], 'page', $page);

		$notifications = collect($paginated->items())->map(fn ($n) => [
			'id' => $n->id,
			'data' => $n->data,
			'read_at' => $n->read_at?->toISOString(),
			'created_at' => $n->created_at->toISOString(),
		]);

		return $this->successResponse(true, [
			'notifications' => $notifications,
			'unread_count' => $user->unreadNotifications()->where('type', \App\Notifications\UserCommunityNotification::class)->count(),
			'has_more' => $paginated->hasMorePages(),
			'total' => $paginated->total(),
		], 'Lấy danh sách thông báo thành công.');
	}

	public function unreadCount(): JsonResponse
	{
		$count = Auth::user()->unreadNotifications()->where('type', \App\Notifications\UserCommunityNotification::class)->count();

		return $this->successResponse(true, ['count' => $count], 'Lấy số thông báo chưa đọc thành công.');
	}

	public function markAsRead(string $id): JsonResponse
	{
		$notification = Auth::user()->notifications()
			->where('type', \App\Notifications\UserCommunityNotification::class)
			->where('id', $id)
			->first();

		if (! $notification) {
			return $this->successResponse(false, null, 'Không tìm thấy thông báo.');
		}

		$notification->markAsRead();

		return $this->successResponse(true, null, 'Đã đánh dấu thông báo là đã đọc.');
	}

	public function markAllAsRead(): JsonResponse
	{
		Auth::user()->unreadNotifications()
			->where('type', \App\Notifications\UserCommunityNotification::class)
			->update(['read_at' => now()]);

		return $this->successResponse(true, null, 'Đã đánh dấu tất cả thông báo là đã đọc.');
	}
}
