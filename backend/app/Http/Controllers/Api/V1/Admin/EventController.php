<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\EventStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
            ->with('creator:id,full_name,avatar', 'department:id,name')
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
            'start_at' => 'required|date',
            'end_at' => 'required|date|after:start_at',
            'location' => 'nullable|string|max:255',
            'max_attendees' => 'nullable|integer|min:1',
            'is_registration_required' => 'boolean',
            'status' => 'nullable|in:draft,published',
            'department_id' => 'nullable|exists:departments,id',
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

        $event->load('creator:id,full_name,avatar', 'department:id,name');

        return $this->createdResponse($this->transform($event), 'Tạo sự kiện thành công.');
    }

    public function show(Event $event): JsonResponse
    {
        $event->loadCount(['registrations', 'checkIns', 'feedbacks'])
            ->load('creator:id,full_name,avatar', 'department:id,name');

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
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date|after:start_at',
            'location' => 'nullable|string|max:255',
            'max_attendees' => 'nullable|integer|min:1',
            'is_registration_required' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
            'thumbnail' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('event-thumbnails', 'public');
        }

        $event->update($data);

        $event->load('creator:id,full_name,avatar', 'department:id,name');

        return $this->successResponse(true, $this->transform($event->fresh(['creator', 'department'])), 'Cập nhật sự kiện thành công.');
    }

    public function updateStatus(Request $request, Event $event): JsonResponse
    {
        // ongoing/ended do hệ thống tự chuyển theo thời gian sự kiện (syncStatuses)
        $request->validate([
            'status' => 'required|in:draft,published,cancelled',
        ]);

        $event->update(['status' => $request->input('status')]);

        return $this->successResponse(true, ['status' => $event->fresh()->status->value], 'Cập nhật trạng thái thành công.');
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
            'thumbnail' => $event->thumbnail
                ? Storage::disk('public')->url($event->thumbnail)
                : null,
            'start_at' => $event->start_at?->toIso8601String(),
            'end_at' => $event->end_at?->toIso8601String(),
            'location' => $event->location,
            'max_attendees' => $event->max_attendees,
            'is_registration_required' => (bool) $event->is_registration_required,
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
            'registrations_count' => (int) ($event->registrations_count ?? 0),
            'check_ins_count' => (int) ($event->check_ins_count ?? 0),
            'feedbacks_count' => (int) ($event->feedbacks_count ?? 0),
            'created_at' => $event->created_at?->toIso8601String(),
            'updated_at' => $event->updated_at?->toIso8601String(),
        ];
    }
}
