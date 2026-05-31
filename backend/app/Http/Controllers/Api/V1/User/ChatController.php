<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Events\MessageSent;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\ChatMember;
use App\Models\ChatRoom;
use App\Models\Message;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends BaseApiController
{
    // ─── Danh sách phòng chat công khai (group) ───────────────────────────────

    public function index(): JsonResponse
    {
        $rooms = ChatRoom::query()
            ->where('type', 'group')
            ->withCount('members')
            ->withCount(['messages as message_count' => fn ($q) => $q->where('type', 'text')])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (ChatRoom $room) => $this->transformRoom($room));

        return $this->successResponse(true, $rooms, 'Lấy danh sách phòng chat thành công.');
    }

    // ─── Tạo phòng chat mới ──────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:50'],
        ]);

        $name = trim($request->input('name'));

        // Kiểm tra tên phòng đã tồn tại chưa
        if (ChatRoom::where('type', 'group')->whereRaw('LOWER(name) = ?', [strtolower($name)])->exists()) {
            return $this->errorResponse(false, 'Tên phòng chat đã tồn tại. Vui lòng chọn tên khác.', 422);
        }

        $room = ChatRoom::create([
            'type' => 'group',
            'name' => $name,
        ]);

        // Tự động thêm người tạo làm admin
        ChatMember::create([
            'room_id'      => $room->id,
            'user_id'      => $request->user()->id,
            'role'         => 'admin',
            'last_read_at' => now(),
        ]);

        $room->loadCount('members');
        $room->loadCount(['messages as message_count' => fn ($q) => $q->where('type', 'text')]);

        return $this->createdResponse($this->transformRoom($room));
    }

    // ─── Tin nhắn trong phòng (phân trang, auth) ─────────────────────────────

    public function messages(Request $request, int $roomId): JsonResponse
    {
        $room = ChatRoom::where('type', 'group')->findOrFail($roomId);

        $perPage = min(50, max(1, (int) $request->query('per_page', 30)));
        $before   = $request->query('before'); // ISO timestamp for pagination
        $beforeId = (int) $request->query('before_id', 0);

        $query = Message::query()
            ->where('room_id', $room->id)
            ->where('type', 'text')
            ->whereNull('deleted_at')
            ->with('creator:id,full_name,email,avatar,username')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($before) {
            $beforeTime = Carbon::parse($before);
            $query->where(function ($q) use ($beforeTime, $beforeId) {
                $q->where('created_at', '<', $beforeTime);

                if ($beforeId > 0) {
                    $q->orWhere(function ($q) use ($beforeTime, $beforeId) {
                        $q->where('created_at', '=', $beforeTime)
                            ->where('id', '<', $beforeId);
                    });
                }
            });
        }

        $messages = $query->limit($perPage)->get()->reverse()->values();

        return $this->successResponse(
            true,
            $messages->map(fn (Message $m) => $this->transformMessage($m)),
            'Lấy tin nhắn thành công.'
        );
    }

    // ─── Gửi tin nhắn ────────────────────────────────────────────────────────

    public function send(Request $request, int $roomId): JsonResponse
    {
        $room = ChatRoom::where('type', 'group')->findOrFail($roomId);

        $request->validate([
            'content'     => ['required', 'string', 'min:1', 'max:2000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
        ]);

        $userId = $request->user()->id;

        // Auto-join if not a member
        ChatMember::firstOrCreate(
            ['room_id' => $room->id, 'user_id' => $userId],
            ['role' => 'member', 'last_read_at' => now()]
        );

        $message = Message::create([
            'room_id'     => $room->id,
            'content'     => $request->input('content'),
            'type'        => 'text',
            'reply_to_id' => $request->input('reply_to_id'),
            'created_by'  => $userId,
        ]);

        $room->update(['last_message_at' => now()]);

        $message->load('creator:id,full_name,email,avatar,username');

        if ($message->reply_to_id) {
            $message->load(['replyTo' => fn ($q) => $q->with('creator:id,full_name')]);
        }

        broadcast(new MessageSent($message));

        return $this->createdResponse($this->transformMessage($message));
    }

    // ─── Polling: tin nhắn mới sau timestamp ─────────────────────────────────

    public function poll(Request $request, int $roomId): JsonResponse
    {
        $room  = ChatRoom::where('type', 'group')->findOrFail($roomId);
        $after = $request->query('after'); // ISO timestamp

        $query = Message::query()
            ->where('room_id', $room->id)
            ->where('type', 'text')
            ->whereNull('deleted_at')
            ->with('creator:id,full_name,email,avatar,username')
            ->orderBy('created_at');

        if ($after) {
            $query->where('created_at', '>', $after);
        }

        $messages = $query->limit(50)->get();

        return $this->successResponse(
            true,
            $messages->map(fn (Message $m) => $this->transformMessage($m)),
            'Polling thành công.'
        );
    }

    // ─── Transforms ──────────────────────────────────────────────────────────

    private function transformRoom(ChatRoom $room): array
    {
        return [
            'id'               => $room->id,
            'name'             => $room->name,
            'type'             => $room->type,
            'member_count'     => $room->members_count ?? 0,
            'message_count'    => $room->message_count ?? 0,
            'last_message_at'  => $room->last_message_at?->toIso8601String(),
            'created_at'       => $room->created_at->toIso8601String(),
        ];
    }

    private function transformMessage(Message $message): array
    {
        $creator = $message->creator;

        return [
            'id'         => $message->id,
            'content'    => $message->content,
            'created_by' => $creator ? [
                'id'        => $creator->id,
                'full_name' => $creator->full_name,
                'email'     => $creator->email,
                'avatar'    => $creator->avatar,
                'username'  => $creator->username,
            ] : null,
            'reply_to'   => $message->replyTo ? [
                'id'        => $message->replyTo->id,
                'content'   => $message->replyTo->content,
                'full_name' => $message->replyTo->creator?->full_name,
            ] : null,
            'created_at' => $message->created_at->toIso8601String(),
        ];
    }
}
