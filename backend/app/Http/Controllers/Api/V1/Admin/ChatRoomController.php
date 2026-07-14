<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ChatMember;
use App\Models\ChatRoom;
use App\Models\Message;
use App\Services\NotificationService;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatRoomController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $search = $request->query('search');

        $allowedSorts = ['id', 'name', 'member_count', 'message_count', 'last_message_at', 'created_at'];
        $sort = in_array($request->query('sort', 'last_message_at'), $allowedSorts, true)
            ? $request->query('sort', 'last_message_at')
            : 'last_message_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'], true)
            ? $request->query('order', 'desc')
            : 'desc';

        $sortColumn = match ($sort) {
            'member_count' => DB::raw('members_count'),
            'message_count' => DB::raw('messages_count'),
            default => $sort,
        };

        $paginated = ChatRoom::query()
            ->withCount(['members', 'messages'])
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sortColumn, $order)
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn (ChatRoom $room) => $this->transformRoom($room));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách phòng chat thành công.',
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'from' => $paginated->firstItem(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'to' => $paginated->lastItem(),
                'total' => $paginated->total(),
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        return $this->successResponse(true, [
            'total' => ChatRoom::count(),
            'system_events' => Message::where('type', 'system')->count(),
        ], 'Lấy thống kê phòng chat thành công.');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'min:2', 'max:50'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ]);

        $name = trim((string) $request->input('name'));

        if ($this->roomNameExists($name)) {
            return $this->validationErrorResponse([
                'name' => ['Tên phòng chat đã tồn tại.'],
            ], 'Tên phòng chat đã tồn tại.');
        }

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('chat-rooms', 'public')
            : null;

        $room = DB::transaction(function () use ($request, $name, $imagePath) {
            $room = ChatRoom::create(['name' => $name, 'image' => $imagePath]);

            if ($request->user()) {
                ChatMember::create([
                    'room_id' => $room->id,
                    'user_id' => $request->user()->id,
                    'role' => 'admin',
                    'last_read_at' => now(),
                ]);
            }

            return $room;
        });

        $room->loadCount(['members', 'messages']);

        return $this->createdResponse($this->transformRoom($room), 'Tạo phòng chat thành công.');
    }

    public function update(Request $request, ChatRoom $room): JsonResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'min:2', 'max:50'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ]);

        $name = trim((string) $request->input('name'));

        if ($this->roomNameExists($name, $room->id)) {
            return $this->validationErrorResponse([
                'name' => ['Tên phòng chat đã tồn tại.'],
            ], 'Tên phòng chat đã tồn tại.');
        }

        $payload = ['name' => $name];

        if ($request->hasFile('image')) {
            if ($room->image && ! Str::startsWith($room->image, ['http://', 'https://'])) {
                $this->storage->delete($room->image);
            }
            $payload['image'] = $this->storage->uploadImage($request->file('image'), 'chat-rooms');
        }

        $room->update($payload);
        $room->loadCount(['members', 'messages']);

        return $this->successResponse(true, $this->transformRoom($room), 'Cập nhật phòng chat thành công.');
    }

    public function trash(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $search  = $request->query('search');

        $allowedSorts = ['id', 'name', 'member_count', 'message_count', 'last_message_at', 'created_at'];
        $sort  = in_array($request->query('sort', 'created_at'), $allowedSorts, true)
            ? $request->query('sort', 'created_at') : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'], true)
            ? $request->query('order', 'desc') : 'desc';

        $sortColumn = match ($sort) {
            'member_count'  => DB::raw('members_count'),
            'message_count' => DB::raw('messages_count'),
            default         => $sort,
        };

        $paginated = ChatRoom::onlyTrashed()
            ->withCount(['members', 'messages'])
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy($sortColumn, $order)
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn (ChatRoom $room) => $this->transformRoom($room));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách thùng rác thành công.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'from'         => $paginated->firstItem(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'to'           => $paginated->lastItem(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    public function destroy(Request $request, ChatRoom $room): JsonResponse
    {
        $admin    = $request->user();
        $roomName = $room->name ?? "Phòng #{$room->id}";

        // Không xóa ảnh ở đây — giữ lại để có thể khôi phục cùng ảnh
        $room->deleted_by = $admin->id;
        $room->save();
        $room->delete();

        NotificationService::dispatch(
            title: 'Phòng chat đã bị xóa',
            message: "{$admin->full_name} đã xóa phòng chat \"{$roomName}\".",
            action: 'deleted',
            entityType: 'chat_room',
            entityId: $room->id,
            performedBy: $admin->full_name,
            link: '/community/chat?view=trash',
            excludeUserId: $admin->id,
        );

        return $this->successResponse(true, null, 'Xóa phòng chat thành công.');
    }

    public function forceDestroy(Request $request, int $id): JsonResponse
    {
        $admin    = $request->user();
        $room     = ChatRoom::onlyTrashed()->findOrFail($id);
        $roomName = $room->name ?? "Phòng #{$room->id}";

        // Xóa ảnh vật lý khi xóa vĩnh viễn
        if ($room->image) {
            $this->storage->delete($room->image);
        }

        $room->forceDelete();

        NotificationService::dispatch(
            title: 'Phòng chat đã bị xóa vĩnh viễn',
            message: "{$admin->full_name} đã xóa vĩnh viễn phòng chat \"{$roomName}\".",
            action: 'force_deleted',
            entityType: 'chat_room',
            entityId: $id,
            performedBy: $admin->full_name,
            link: '/community/chat',
            excludeUserId: $admin->id,
        );

        return $this->successResponse(true, null, 'Đã xóa vĩnh viễn phòng chat.');
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $admin    = $request->user();
        $room     = ChatRoom::onlyTrashed()->findOrFail($id);
        $roomName = $room->name ?? "Phòng #{$room->id}";

        $room->restore();
        $room->update(['deleted_by' => null]);

        $room->loadCount(['members', 'messages']);

        NotificationService::dispatch(
            title: 'Phòng chat đã được khôi phục',
            message: "{$admin->full_name} đã khôi phục phòng chat \"{$roomName}\".",
            action: 'restored',
            entityType: 'chat_room',
            entityId: $room->id,
            performedBy: $admin->full_name,
            link: '/community/chat',
            excludeUserId: $admin->id,
        );

        return $this->successResponse(true, $this->transformRoom($room), 'Khôi phục phòng chat thành công.');
    }

    public function systemMessages(Request $request, int $roomId): JsonResponse
    {
        $room = ChatRoom::findOrFail($roomId);
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $eventType = $request->query('event_type');

        $paginated = Message::query()
            ->where('room_id', $room->id)
            ->where('type', 'system')
            ->with('creator:id,full_name,email,avatar')
            ->when(
                $eventType && $eventType !== 'all',
                fn ($query) => $query->where('event_type', $eventType)
            )
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn (Message $message) => $this->transformMessage($message));

        return response()->json([
            'success' => true,
            'message' => 'Lấy nhật ký sự kiện thành công.',
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'from' => $paginated->firstItem(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'to' => $paginated->lastItem(),
                'total' => $paginated->total(),
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
            'room' => [
                'id' => $room->id,
                'name' => $room->name,
            ],
        ]);
    }

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

    private function transformRoom(ChatRoom $room): array
    {
        return [
            'id'              => $room->id,
            'name'            => $room->name,
            'image'           => $this->resolveImageUrl($room->image),
            'member_count'    => $room->members_count ?? 0,
            'message_count'   => $room->messages_count ?? 0,
            'last_message_at' => $room->last_message_at?->toISOString(),
            'created_at'      => $room->created_at->toISOString(),
            'deleted_at'      => $room->deleted_at?->toISOString(),
        ];
    }

    private function resolveImageUrl(?string $image): ?string
    {
        // DB now stores the full public URL (Supabase https://... or external).
        return $image ?: null;
    }

    private function transformMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'event_type' => $message->event_type,
            'content' => $message->content,
            'created_at' => $message->created_at->toISOString(),
            'creator' => $message->creator ? [
                'id' => $message->creator->id,
                'full_name' => $message->creator->full_name,
                'email' => $message->creator->email,
                'avatar' => $message->creator->avatar,
            ] : null,
        ];
    }

    private function roomNameExists(string $name, ?int $ignoreId = null): bool
    {
        return ChatRoom::withTrashed()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists();
    }
}
