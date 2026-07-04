<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\EventStatus;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventFeedback;
use App\Models\EventGalleryItem;
use App\Models\EventRegistration;
use App\Models\User;
use App\Notifications\AdminActionNotification;
use App\Services\UserNotificationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        Event::syncStatuses();

        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');
        $status = $request->query('status');

        $sortable = ['id', 'title', 'status', 'start_at', 'end_at', 'created_at', 'registrations_count', 'department_name', 'creator_name'];
        $sort = in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'start_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $events = Event::query()
            ->withCount(['registrations', 'checkIns'])
            ->with('creator:id,full_name,avatar', 'department:id,name', 'organizer:id,full_name,avatar')
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($sort === 'department_name', fn ($q) => $q->orderByRaw("(SELECT name FROM departments WHERE departments.id = events.department_id) {$order}"))
            ->when($sort === 'creator_name', fn ($q) => $q->orderByRaw("(SELECT full_name FROM users WHERE users.id = events.created_by) {$order}"))
            ->when(! in_array($sort, ['department_name', 'creator_name'], true), fn ($q) => $q->orderBy($sort, $order))
            ->paginate($perPage);

        $events->getCollection()->transform(fn (Event $e) => $this->transform($e));

        return $this->paginatedResponse($events, ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'content' => 'nullable|string',
            'feedback_form_url' => 'nullable|url|max:2048',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after:start_at',
            'registration_start_at' => 'nullable|date',
            'registration_end_at' => 'nullable|date|after:registration_start_at',
            'location' => 'nullable|string|max:255',
            'max_attendees' => 'nullable|integer|min:1',
            'is_members_only' => 'boolean',
            'status' => 'nullable|in:draft,published',
            'department_id' => 'nullable|exists:departments,id',
            'organizer_id' => 'nullable|exists:users,id',
            'thumbnail' => 'nullable|image|max:5120',
        ]);

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('event-thumbnails', 'public');
        }

        $event = DB::transaction(function () use ($data, $thumbnailPath, $request) {
            return Event::create([
                ...$data,
                'created_by' => $request->user()->id,
                'slug' => Event::generateUniqueSlug($data['title']),
                'thumbnail' => $thumbnailPath,
                'status' => $data['status'] ?? 'draft',
            ]);
        });

        $event->syncStatusFromSchedule();
        $event->load('creator:id,full_name,avatar', 'department:id,name', 'organizer:id,full_name,avatar');

        if (($data['status'] ?? 'draft') === 'published') {
            $this->notifyOrganizerEventPublished($event, $request->user());
        }

        return $this->createdResponse($this->transform($event), 'Tạo sự kiện thành công.');
    }

    public function show(Event $event): JsonResponse
    {
        $event->loadCount(['registrations', 'checkIns', 'feedbacks'])
            ->load('creator:id,full_name,avatar', 'department:id,name', 'organizer:id,full_name,avatar');

        $data = $this->transform($event);
        $data['content'] = $event->content;

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'content' => 'nullable|string',
            'feedback_form_url' => 'nullable|url|max:2048',
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date|after:start_at',
            'registration_start_at' => 'nullable|date',
            'registration_end_at' => 'nullable|date|after:registration_start_at',
            'location' => 'nullable|string|max:255',
            'max_attendees' => 'nullable|integer|min:1',
            'is_members_only' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
            'organizer_id' => 'nullable|exists:users,id',
            'thumbnail' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('event-thumbnails', 'public');
        }

        $isAlreadyPublished = in_array($event->status->value, ['published', 'ongoing', 'ended'], true);
        $previousOrganizerId = $event->organizer_id;

        $event->update($data);
        $event->refresh();
        $event->syncStatusFromSchedule();

        $event->load('creator:id,full_name,avatar', 'department:id,name', 'organizer:id,full_name,avatar');

        if ($isAlreadyPublished && $event->organizer_id && $event->organizer_id !== $previousOrganizerId) {
            $this->notifyOrganizerAssigned($event, $request->user());
        }

        return $this->successResponse(true, $this->transform($event), 'Cập nhật sự kiện thành công.');
    }

    public function updateStatus(Request $request, Event $event): JsonResponse
    {
        // ongoing/ended do hệ thống tự chuyển theo thời gian sự kiện (syncStatuses)
        $request->validate([
            'status' => 'required|in:draft,published,cancelled',
        ]);

        $newStatus = $request->input('status');
        $shouldNotifyOrganizer = $newStatus === 'published' && $event->status->value !== 'published';

        $event->update(['status' => $newStatus]);
        $event->refresh();
        $event->syncStatusFromSchedule();

        if ($shouldNotifyOrganizer) {
            $this->notifyOrganizerEventPublished($event, $request->user());
        }

        return $this->successResponse(true, ['status' => $event->status->value], 'Cập nhật trạng thái thành công.');
    }

    /**
     * Thông báo cho người phụ trách khi sự kiện được đăng (không tự thông báo cho chính người thao tác).
     */
    private function notifyOrganizerEventPublished(Event $event, User $performedBy): void
    {
        $organizer = $event->organizer ?? ($event->organizer_id ? User::find($event->organizer_id) : null);

        if (! $organizer || $organizer->id === $performedBy->id) {
            return;
        }

        $organizer->notify(new AdminActionNotification(
            'Sự kiện đã được đăng',
            "Sự kiện \"{$event->title}\" mà bạn phụ trách đã được đăng.",
            'event_published',
            'event',
            $event->id,
            $performedBy->full_name,
            "/events/{$event->id}"
        ));
    }

    /**
     * Thông báo cho người phụ trách mới khi được gán vào một sự kiện đã đăng.
     */
    private function notifyOrganizerAssigned(Event $event, User $performedBy): void
    {
        $organizer = $event->organizer;

        if (! $organizer || $organizer->id === $performedBy->id) {
            return;
        }

        $organizer->notify(new AdminActionNotification(
            'Được gán làm người phụ trách sự kiện',
            "Bạn đã được gán làm người phụ trách sự kiện \"{$event->title}\".",
            'event_organizer_assigned',
            'event',
            $event->id,
            $performedBy->full_name,
            "/events/{$event->id}"
        ));
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();

        return $this->successResponse(true, null, 'Xóa sự kiện thành công.');
    }

    public function registrations(Event $event): JsonResponse
    {
        $registrations = $event->registrations()
            ->with([
                'user:id,full_name,email,avatar',
                'checkIn:id,registration_id,checked_in_at,method,checked_in_by',
                'checkIn.checkedInBy:id,full_name',
            ])
            ->orderByDesc('registered_at')
            ->get()
            ->map(fn (EventRegistration $registration) => $this->transformRegistration($registration));

        return $this->successResponse(true, $registrations, ApiMessage::RETRIEVED);
    }

    /**
     * Danh sách thành viên CLB chưa đăng ký sự kiện (chỉ dùng cho sự kiện dành riêng thành viên).
     */
    public function unregisteredMembers(Event $event): JsonResponse
    {
        if (! $event->is_members_only) {
            return $this->successResponse(true, [], ApiMessage::RETRIEVED);
        }

        $members = User::role($this->clubMemberRoles())
            ->whereNotIn('id', $event->registrations()->select('user_id'))
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'email', 'avatar'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ]);

        return $this->successResponse(true, $members, ApiMessage::RETRIEVED);
    }

    /**
     * Gửi thông báo nhắc đăng ký tới thành viên CLB chưa đăng ký.
     * Không truyền user_ids sẽ nhắc toàn bộ thành viên chưa đăng ký.
     */
    public function remindUnregisteredMembers(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'user_ids' => 'nullable|array|min:1',
            'user_ids.*' => 'integer',
        ]);

        if (! $event->is_members_only) {
            return $this->errorResponse(false, 'Chỉ nhắc nhở được với sự kiện dành riêng cho thành viên câu lạc bộ.', 422);
        }

        Event::syncStatuses();
        $event->refresh();

        if ($event->status->value !== 'published') {
            return $this->errorResponse(false, 'Chỉ có thể nhắc nhở khi sự kiện đang mở đăng ký.', 422);
        }

        if ($event->registration_end_at && now()->gt($event->registration_end_at)) {
            return $this->errorResponse(false, 'Đã hết thời gian đăng ký nên không thể nhắc nhở.', 422);
        }

        $members = User::role($this->clubMemberRoles())
            ->whereNotIn('id', $event->registrations()->select('user_id'))
            ->when(! empty($data['user_ids']), fn ($q) => $q->whereIn('id', $data['user_ids']))
            ->get();

        if ($members->isEmpty()) {
            return $this->errorResponse(false, 'Không có thành viên nào cần nhắc nhở.', 422);
        }

        foreach ($members as $member) {
            UserNotificationService::dispatchEventRegistrationReminder($member, $request->user(), $event);
        }

        return $this->successResponse(
            true,
            ['reminded_count' => $members->count()],
            "Đã gửi nhắc nhở tới {$members->count()} thành viên.",
        );
    }

    /**
     * Thành viên CLB = có bất kỳ vai trò nào ngoài "user" thường (đồng bộ với logic đăng ký phía user).
     */
    private function clubMemberRoles(): array
    {
        return array_values(array_filter(
            array_map(fn (RolesEnum $case) => $case->value, RolesEnum::cases()),
            fn (string $role) => $role !== RolesEnum::USER->value,
        ));
    }

    public function checkIn(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'qr_token' => 'required_without:registration_id|string',
            'registration_id' => 'required_without:qr_token|integer',
        ]);

        Event::syncStatuses();
        $event->refresh();

        if (in_array($event->status->value, ['draft', 'cancelled'], true)) {
            return $this->errorResponse(false, 'Sự kiện hiện không thể điểm danh.', 422);
        }

        $registration = $event->registrations()
            ->when(isset($data['qr_token']), fn ($q) => $q->where('qr_token', $data['qr_token']))
            ->when(isset($data['registration_id']), fn ($q) => $q->where('id', $data['registration_id']))
            ->with('user:id,full_name,email,avatar')
            ->first();

        if (! $registration) {
            return $this->errorResponse(false, 'Mã QR không hợp lệ hoặc không thuộc sự kiện này.', 404);
        }

        if ($registration->status === 'cancelled') {
            return $this->errorResponse(false, "{$registration->user?->full_name} đã hủy đăng ký sự kiện này.", 422);
        }

        if ($registration->checkIn()->exists()) {
            return $this->errorResponse(false, "{$registration->user?->full_name} đã điểm danh trước đó.", 422);
        }

        try {
            DB::transaction(function () use ($event, $registration, $request, $data) {
                EventCheckIn::create([
                    'event_id' => $event->id,
                    'registration_id' => $registration->id,
                    'user_id' => $registration->user_id,
                    'checked_in_by' => $request->user()->id,
                    'checked_in_at' => now(),
                    'method' => isset($data['qr_token']) ? 'qr' : 'manual',
                ]);

                $registration->update(['status' => 'attended']);
            });
        } catch (QueryException $e) {
            // Hai lượt quét cùng một vé gần như đồng thời: lượt sau đụng unique(registration_id)
            return $this->errorResponse(false, "{$registration->user?->full_name} đã điểm danh trước đó.", 422);
        }

        $registration->refresh()->load([
            'user:id,full_name,email,avatar',
            'checkIn:id,registration_id,checked_in_at,method,checked_in_by',
            'checkIn.checkedInBy:id,full_name',
        ]);

        return $this->successResponse(true, $this->transformRegistration($registration), 'Điểm danh thành công.');
    }

    public function stats(): JsonResponse
    {
        Event::syncStatuses();

        $counts = DB::table('events')
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse(true, [
            'total' => $counts->sum(),
            'draft' => (int) ($counts['draft'] ?? 0),
            'published' => (int) ($counts['published'] ?? 0),
            'ongoing' => (int) ($counts['ongoing'] ?? 0),
            'ended' => (int) ($counts['ended'] ?? 0),
            'cancelled' => (int) ($counts['cancelled'] ?? 0),
        ], ApiMessage::RETRIEVED);
    }

    /**
     * Danh sách đánh giá + thống kê (trung bình, phân phối sao, tỉ lệ phản hồi).
     */
    public function feedbacks(Event $event): JsonResponse
    {
        $feedbacks = $event->feedbacks()
            ->with('user:id,full_name,email,avatar')
            ->latest()
            ->get()
            ->map(fn (EventFeedback $f) => [
                'id' => $f->id,
                'rating' => $f->rating,
                'comment' => $f->comment,
                'created_at' => $f->created_at?->toIso8601String(),
                'user' => $f->user ? [
                    'id' => $f->user->id,
                    'full_name' => $f->user->full_name,
                    'email' => $f->user->email,
                    'avatar' => $f->user->avatar,
                ] : null,
            ]);

        $ratings = $feedbacks->pluck('rating');
        $total = $ratings->count();

        $distribution = [];
        foreach (range(1, 5) as $star) {
            $distribution[$star] = $ratings->filter(fn ($r) => (int) $r === $star)->count();
        }

        $attendedCount = $event->checkIns()->distinct('user_id')->count('user_id');

        return $this->successResponse(true, [
            'items' => $feedbacks,
            'stats' => [
                'average_rating' => $total > 0 ? round($ratings->avg(), 1) : 0,
                'total' => $total,
                'distribution' => $distribution,
                'attended_count' => $attendedCount,
                'response_rate' => $attendedCount > 0 ? (int) round($total / $attendedCount * 100) : 0,
            ],
        ], ApiMessage::RETRIEVED);
    }

    /**
     * Xóa (kiểm duyệt) một đánh giá không phù hợp.
     */
    public function destroyFeedback(Event $event, EventFeedback $feedback): JsonResponse
    {
        abort_if($feedback->event_id !== $event->id, 404);

        $feedback->delete();

        return $this->successResponse(true, null, 'Đã xóa đánh giá.');
    }

    /**
     * Danh sách ảnh trong thư viện sự kiện (sắp theo display_order).
     */
    public function gallery(Event $event): JsonResponse
    {
        $items = $event->galleryItems()
            ->get()
            ->map(fn (EventGalleryItem $item) => $this->transformGalleryItem($item));

        return $this->successResponse(true, $items, ApiMessage::RETRIEVED);
    }

    /**
     * Tải một hoặc nhiều ảnh lên thư viện sự kiện.
     */
    public function storeGalleryItem(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'images' => 'required|array|min:1|max:20',
            'images.*' => 'image|max:5120',
            'caption' => 'nullable|string|max:255',
        ]);

        $maxOrder = (int) $event->galleryItems()->max('display_order');

        $created = DB::transaction(function () use ($request, $event, &$maxOrder) {
            $items = [];
            foreach ($request->file('images') as $file) {
                $path = $file->store("event-gallery/{$event->id}", 'public');
                $items[] = EventGalleryItem::create([
                    'event_id' => $event->id,
                    'uploaded_by' => $request->user()->id,
                    'image_url' => Storage::disk('public')->url($path),
                    'caption' => $request->input('caption'),
                    'display_order' => ++$maxOrder,
                ]);
            }

            return $items;
        });

        $data = collect($created)->map(fn (EventGalleryItem $item) => $this->transformGalleryItem($item));

        return $this->createdResponse($data, 'Tải ảnh lên thành công.');
    }

    /**
     * Xóa một ảnh khỏi thư viện (kèm xóa file vật lý nếu lưu trên storage nội bộ).
     */
    public function destroyGalleryItem(Event $event, EventGalleryItem $galleryItem): JsonResponse
    {
        abort_if($galleryItem->event_id !== $event->id, 404);

        $path = Str::after($galleryItem->image_url, '/storage/');
        if ($path && $path !== $galleryItem->image_url) {
            Storage::disk('public')->delete($path);
        }

        $galleryItem->delete();

        return $this->successResponse(true, null, 'Đã xóa ảnh.');
    }

    /**
     * Sắp xếp lại thứ tự ảnh trong thư viện theo mảng id truyền lên.
     */
    public function reorderGallery(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::transaction(function () use ($data, $event) {
            foreach ($data['ids'] as $order => $id) {
                EventGalleryItem::where('event_id', $event->id)
                    ->where('id', $id)
                    ->update(['display_order' => $order]);
            }
        });

        return $this->successResponse(true, null, 'Đã cập nhật thứ tự ảnh.');
    }

    private function transformGalleryItem(EventGalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'image_url' => $item->image_url,
            'caption' => $item->caption,
            'display_order' => $item->display_order,
            'created_at' => $item->created_at?->toIso8601String(),
        ];
    }

    private function transformRegistration(EventRegistration $registration): array
    {
        return [
            'id' => $registration->id,
            'status' => $registration->status,
            'registered_at' => $registration->registered_at?->toIso8601String(),
            'cancelled_at' => $registration->cancelled_at?->toIso8601String(),
            'user' => $registration->user ? [
                'id' => $registration->user->id,
                'full_name' => $registration->user->full_name,
                'email' => $registration->user->email,
                'avatar' => $registration->user->avatar,
            ] : null,
            'check_in' => $registration->checkIn ? [
                'checked_in_at' => $registration->checkIn->checked_in_at?->toIso8601String(),
                'method' => $registration->checkIn->method,
                'checked_in_by' => $registration->checkIn->checkedInBy?->full_name,
            ] : null,
        ];
    }

    private function transform(Event $event): array
    {
        return [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'description' => $event->description,
            'feedback_form_url' => $event->feedback_form_url,
            'thumbnail' => $event->thumbnail
                ? Storage::disk('public')->url($event->thumbnail)
                : null,
            'start_at' => $event->start_at?->toIso8601String(),
            'end_at' => $event->end_at?->toIso8601String(),
            'registration_start_at' => $event->registration_start_at?->toIso8601String(),
            'registration_end_at' => $event->registration_end_at?->toIso8601String(),
            'location' => $event->location,
            'max_attendees' => $event->max_attendees,
            'is_members_only' => (bool) $event->is_members_only,
            'status' => $event->status instanceof EventStatus
                ? $event->status->value
                : $event->status,
            'creator' => $event->creator ? [
                'id' => $event->creator->id,
                'full_name' => $event->creator->full_name,
                'avatar' => $event->creator->avatar,
            ] : null,
            'department' => $event->department
                ? ['id' => $event->department->id, 'name' => $event->department->name]
                : null,
            'organizer' => $event->organizer ? [
                'id' => $event->organizer->id,
                'full_name' => $event->organizer->full_name,
                'avatar' => $event->organizer->avatar,
            ] : null,
            'registrations_count' => (int) ($event->registrations_count ?? 0),
            'check_ins_count' => (int) ($event->check_ins_count ?? 0),
            'feedbacks_count' => (int) ($event->feedbacks_count ?? 0),
            'created_at' => $event->created_at?->toIso8601String(),
            'updated_at' => $event->updated_at?->toIso8601String(),
        ];
    }
}
