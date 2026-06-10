<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\EventStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EventController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $events = Event::query()
            ->whereIn('status', ['published', 'ongoing'])
            ->withCount('registrations')
            ->with('creator:id,full_name,avatar')
            ->orderBy('start_at', 'asc')
            ->paginate(12);

        $user = $request->user();
        $events->getCollection()->transform(function (Event $e) use ($user) {
            $data = $this->transformPublic($e);
            if ($user) {
                $reg = $e->registrations()->where('user_id', $user->id)->first();
                $data['my_registration_status'] = $reg?->status;
            }

            return $data;
        });

        return $this->paginatedResponse($events, 'Lấy danh sách sự kiện thành công.');
    }

    public function show(Request $request, Event $event): JsonResponse
    {
        abort_if(
            ! in_array($event->status->value, ['published', 'ongoing', 'ended']),
            404
        );

        $event->loadCount(['registrations', 'feedbacks']);
        $data = $this->transformPublic($event);
        $data['content'] = $event->content;

        if ($user = $request->user()) {
            $reg = $event->registrations()->where('user_id', $user->id)->first();
            $data['my_registration_status'] = $reg?->status;
            $data['my_qr_token'] = $reg?->status === 'registered' ? $reg->qr_token : null;
            $data['has_feedback'] = $event->feedbacks()->where('user_id', $user->id)->exists();
        }

        return $this->successResponse(true, $data, 'Lấy thông tin sự kiện thành công.');
    }

    public function register(Request $request, Event $event): JsonResponse
    {
        abort_if($event->status->value !== 'published', 422, 'Sự kiện này hiện không mở đăng ký.');
        abort_if($event->isFull(), 422, 'Sự kiện đã đủ số lượng người tham dự.');

        $user = $request->user();

        $existing = $event->registrations()->where('user_id', $user->id)->first();

        if ($existing) {
            if ($existing->status === 'registered') {
                return $this->errorResponse(false, 'Bạn đã đăng ký sự kiện này rồi.', 422);
            }

            $existing->update([
                'status' => 'registered',
                'qr_token' => EventRegistration::generateQrToken($event->id, $user->id),
                'registered_at' => now(),
                'cancelled_at' => null,
            ]);

            return $this->successResponse(true, ['qr_token' => $existing->fresh()->qr_token], 'Đăng ký thành công.');
        }

        $registration = DB::transaction(fn () => EventRegistration::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'qr_token' => EventRegistration::generateQrToken($event->id, $user->id),
            'status' => 'registered',
            'registered_at' => now(),
        ]));

        return $this->createdResponse(['qr_token' => $registration->qr_token], 'Đăng ký thành công.');
    }

    public function cancelRegistration(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        $reg = $event->registrations()->where('user_id', $user->id)->where('status', 'registered')->firstOrFail();

        $reg->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return $this->successResponse(true, null, 'Hủy đăng ký thành công.');
    }

    public function myTicket(Request $request, Event $event): JsonResponse
    {
        $reg = $event->registrations()
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->firstOrFail();

        return $this->successResponse(true, [
            'qr_token' => $reg->qr_token,
            'event_title' => $event->title,
            'start_at' => $event->start_at?->toIso8601String(),
            'location' => $event->location,
        ], 'Lấy vé thành công.');
    }

    private function transformPublic(Event $event): array
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
            'registrations_count' => (int) ($event->registrations_count ?? 0),
            'is_full' => $event->isFull(),
            'creator' => $event->creator
                ? ['id' => $event->creator->id, 'full_name' => $event->creator->full_name, 'avatar' => $event->creator->avatar]
                : null,
        ];
    }
}
