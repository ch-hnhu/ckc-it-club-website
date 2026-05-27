<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ChatRoom;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatRoomController extends BaseApiController
{
    // ─── Danh sách phòng chat ─────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $perPage  = min(50, max(1, (int) $request->query('per_page', 20)));
        $search   = $request->query('search');
        $type     = $request->query('type'); // 'direct' | 'group'

        $allowedSorts = ['id', 'name', 'member_count', 'system_events_count', 'last_message_at', 'created_at'];
        $sort  = in_array($request->query('sort', 'last_message_at'), $allowedSorts)
            ? $request->query('sort', 'last_message_at')
            : 'last_message_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';

        $paginated = ChatRoom::query()
            ->withCount([
                'members',
                'messages',
                'messages as system_events_count' => fn ($q) => $q->where('type', 'system'),
            ])
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($type && in_array($type, ['direct', 'group']), fn ($q) => $q->where('type', $type))
            ->orderBy($sort === 'member_count' || $sort === 'system_events_count'
                ? DB::raw($sort)  // calculated columns
                : $sort, $order)
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn ($room) => $this->transformRoom($room));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách phòng chat thành công.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'from'         => $paginated->firstItem(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'to'           => $paginated->lastItem(),
                'total'        => $paginated->total(),
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last'  => $paginated->url($paginated->lastPage()),
                'prev'  => $paginated->previousPageUrl(),
                'next'  => $paginated->nextPageUrl(),
            ],
        ]);
    }

    // ─── Thống kê ─────────────────────────────────────────────────────────────

    public function stats(): JsonResponse
    {
        $total        = ChatRoom::count();
        $groupCount   = ChatRoom::where('type', 'group')->count();
        $directCount  = ChatRoom::where('type', 'direct')->count();
        $systemEvents = Message::where('type', 'system')->count();

        return $this->successResponse(true, [
            'total'         => $total,
            'group_count'   => $groupCount,
            'direct_count'  => $directCount,
            'system_events' => $systemEvents,
        ], 'Lấy thống kê phòng chat thành công.');
    }

    // ─── Nhật ký sự kiện hệ thống của 1 phòng ────────────────────────────────

    public function systemMessages(Request $request, int $roomId): JsonResponse
    {
        $room = ChatRoom::findOrFail($roomId);

        $perPage   = min(50, max(1, (int) $request->query('per_page', 20)));
        $eventType = $request->query('event_type');

        $paginated = Message::query()
            ->where('room_id', $room->id)
            ->where('type', 'system')
            ->with('creator:id,full_name,email,avatar')
            ->when(
                $eventType && $eventType !== 'all',
                fn ($q) => $q->where('event_type', $eventType)
            )
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn ($msg) => $this->transformMessage($msg));

        return response()->json([
            'success' => true,
            'message' => 'Lấy nhật ký sự kiện thành công.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'from'         => $paginated->firstItem(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'to'           => $paginated->lastItem(),
                'total'        => $paginated->total(),
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last'  => $paginated->url($paginated->lastPage()),
                'prev'  => $paginated->previousPageUrl(),
                'next'  => $paginated->nextPageUrl(),
            ],
            'room' => [
                'id'   => $room->id,
                'name' => $room->name,
                'type' => $room->type,
            ],
        ]);
    }

    // ─── Xóa 1 system message ─────────────────────────────────────────────────

    public function destroyMessage(int $roomId, int $messageId): JsonResponse
    {
        $message = Message::where('room_id', $roomId)
            ->where('id', $messageId)
            ->where('type', 'system')
            ->first();

        if (! $message) {
            return $this->successResponse(false, null, 'Không tìm thấy sự kiện.');
        }

        $message->delete();

        return $this->successResponse(true, null, 'Đã xóa sự kiện.');
    }

    // ─── Transforms ───────────────────────────────────────────────────────────

    private function transformRoom(ChatRoom $room): array
    {
        return [
            'id'                   => $room->id,
            'type'                 => $room->type,
            'name'                 => $room->name,
            'member_count'         => $room->members_count ?? 0,
            'message_count'        => $room->messages_count ?? 0,
            'system_events_count'  => $room->system_events_count ?? 0,
            'last_message_at'      => $room->last_message_at?->toISOString(),
            'created_at'           => $room->created_at->toISOString(),
        ];
    }

    private function transformMessage(Message $msg): array
    {
        return [
            'id'         => $msg->id,
            'event_type' => $msg->event_type,
            'content'    => $msg->content,
            'created_at' => $msg->created_at->toISOString(),
            'creator'    => $msg->creator ? [
                'id'        => $msg->creator->id,
                'full_name' => $msg->creator->full_name,
                'email'     => $msg->creator->email,
                'avatar'    => $msg->creator->avatar,
            ] : null,
        ];
    }
}
