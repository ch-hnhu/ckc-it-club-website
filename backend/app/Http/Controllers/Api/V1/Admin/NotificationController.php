<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));

        $paginated = $user->notifications()->latest()->paginate($perPage, ['*'], 'page', $page);

        $notifications = collect($paginated->items())->map(fn($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read_at' => $n->read_at?->toISOString(),
            'created_at' => $n->created_at->toISOString(),
        ]);

        return $this->successResponse(true, [
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
            'has_more' => $paginated->hasMorePages(),
            'total' => $paginated->total(),
        ], 'Lấy danh sách thông báo thành công.');
    }

    public function unreadCount(): JsonResponse
    {
        $count = Auth::user()->unreadNotifications()->count();

        return $this->successResponse(true, ['count' => $count], 'Lấy số thông báo chưa đọc thành công.');
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = Auth::user()->notifications()->where('id', $id)->first();

        if (! $notification) {
            return $this->successResponse(false, null, 'Không tìm thấy thông báo.');
        }

        $notification->markAsRead();

        return $this->successResponse(true, null, 'Đã đánh dấu thông báo là đã đọc.');
    }

    public function markAllAsRead(): JsonResponse
    {
        Auth::user()->unreadNotifications()->update(['read_at' => now()]);

        return $this->successResponse(true, null, 'Đã đánh dấu tất cả thông báo là đã đọc.');
    }

    // ─── Admin: full notification log ────────────────────────────────────────

    public function log(Request $request): JsonResponse
    {
        $allowedSorts = ['created_at', 'community_type', 'read_at'];
        $sort  = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';
        $perPage       = min(50, max(1, (int) $request->query('per_page', 20)));
        $communityType = $request->query('community_type');
        $readStatus    = $request->query('read_status');

        $paginated = DB::table('notifications')
            ->leftJoin('users as recipients', 'notifications.recipient_id', '=', 'recipients.id')
            ->leftJoin('users as actors',     'notifications.actor_id',     '=', 'actors.id')
            ->select([
                'notifications.id',
                'notifications.type',
                'notifications.community_type',
                'notifications.target_type',
                'notifications.target_id',
                'notifications.message',
                'notifications.read_at',
                'notifications.created_at',
                'recipients.id        as recipient_id',
                'recipients.full_name as recipient_name',
                'recipients.email     as recipient_email',
                'recipients.avatar    as recipient_avatar',
                'actors.id            as actor_id',
                'actors.full_name     as actor_name',
                'actors.email         as actor_email',
                'actors.avatar        as actor_avatar',
            ])
            ->whereNotNull('notifications.recipient_id')
            ->when(
                $communityType && $communityType !== 'all',
                fn ($q) => $communityType === 'system'
                    ? $q->whereNull('notifications.community_type')
                    : $q->where('notifications.community_type', $communityType)
            )
            ->when($readStatus === 'read',   fn ($q) => $q->whereNotNull('notifications.read_at'))
            ->when($readStatus === 'unread', fn ($q) => $q->whereNull('notifications.read_at'))
            ->orderBy("notifications.{$sort}", $order)
            ->paginate($perPage);

        return $this->paginatedResponse($paginated, 'Lấy nhật ký thông báo thành công.');
    }

    public function adminStats(): JsonResponse
    {
        $total       = DB::table('notifications')->whereNotNull('recipient_id')->count();
        $unread      = DB::table('notifications')->whereNotNull('recipient_id')->whereNull('read_at')->count();
        $autoCount   = DB::table('notifications')->whereNotNull('recipient_id')->whereNotNull('community_type')->count();
        $systemCount = $total - $autoCount;
        $readRate    = $total > 0 ? round((($total - $unread) / $total) * 100) : 0;

        return $this->successResponse(true, [
            'total'        => $total,
            'unread'       => $unread,
            'auto_count'   => $autoCount,
            'system_count' => $systemCount,
            'read_rate'    => $readRate,
        ], 'Lấy thống kê thông báo thành công.');
    }

    public function adminDestroy(string $id): JsonResponse
    {
        $deleted = DB::table('notifications')->where('id', $id)->delete();

        if (! $deleted) {
            return $this->successResponse(false, null, 'Không tìm thấy thông báo.');
        }

        return $this->successResponse(true, null, 'Đã xóa thông báo.');
    }
}
