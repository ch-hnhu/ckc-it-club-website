<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\EventStatus;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\ModerateEventFeedbackJob;
use App\Models\Event;
use App\Models\EventFeedback;
use App\Models\EventGalleryItem;
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

        $publicStatuses = ['published', 'ongoing', 'ended'];
        $status = in_array($request->query('status'), $publicStatuses, true)
            ? $request->query('status')
            : null;
        $perPage = min((int) $request->query('per_page', 12), 50);
        $search = $request->query('search');

        $events = Event::query()
            ->whereIn('status', $status ? [$status] : $publicStatuses)
            ->withCount('registrations')
            ->with('creator:id,full_name,avatar')
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            // Đang diễn ra → sắp diễn ra (gần nhất trước) → đã kết thúc (mới nhất trước)
            ->orderByRaw("CASE status WHEN 'ongoing' THEN 0 WHEN 'published' THEN 1 ELSE 2 END")
            ->orderByRaw("CASE WHEN status = 'ended' THEN NULL ELSE start_at END asc")
            ->orderByDesc('start_at')
            ->paginate($perPage);

        $user = auth('sanctum')->user();
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
        Event::syncStatuses();
        $event->refresh();

        abort_if(
            ! in_array($event->status->value, ['published', 'ongoing', 'ended']),
            404
        );

        $event->loadCount(['registrations', 'feedbacks']);
        $data = $this->transformPublic($event);
        $data['content'] = $event->content;
        $data['feedback_form_url'] = $event->feedback_form_url;
        $data['gallery'] = $event->galleryItems()->get()->map(fn (EventGalleryItem $item) => [
            'id' => $item->id,
            'image_url' => $item->image_url,
            'caption' => $item->caption,
        ])->all();
        $data['feedback_summary'] = $this->feedbackSummary($event);

        if ($user = auth('sanctum')->user()) {
            $reg = $event->registrations()->where('user_id', $user->id)->first();
            $data['my_registration_status'] = $reg?->status;
            $data['my_qr_token'] = $reg?->status === 'registered' ? $reg->qr_token : null;
            $data['my_attended'] = $event->checkIns()->where('user_id', $user->id)->exists();
            $myFeedback = $event->feedbacks()->where('user_id', $user->id)->first();
            $data['my_feedback'] = $myFeedback
                ? [
                    'rating' => $myFeedback->rating,
                    'comment' => $myFeedback->comment,
                    'is_hidden' => (bool) $myFeedback->is_hidden,
                    'moderation_reason' => $myFeedback->moderation_reason,
                ]
                : null;
            $data['has_feedback'] = $myFeedback !== null;
        }

        return $this->successResponse(true, $data, 'Lấy thông tin sự kiện thành công.');
    }

    /**
     * Danh sách đánh giá công khai của một sự kiện (hiển thị ở trang chi tiết).
     */
    public function feedbacks(Request $request, Event $event): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);

        $feedbacks = $event->feedbacks()
            ->where('is_hidden', false)
            ->with('user:id,full_name,avatar')
            ->latest()
            ->paginate($perPage);

        $feedbacks->getCollection()->transform(fn (EventFeedback $f) => [
            'id' => $f->id,
            'rating' => $f->rating,
            'comment' => $f->comment,
            'created_at' => $f->created_at?->toIso8601String(),
            'user' => $f->user
                ? ['id' => $f->user->id, 'full_name' => $f->user->full_name, 'avatar' => $f->user->avatar]
                : null,
        ]);

        return $this->paginatedResponse($feedbacks, 'Lấy đánh giá sự kiện thành công.');
    }

    /**
     * Gửi (hoặc cập nhật) đánh giá sau khi sự kiện kết thúc. Chỉ người đã điểm danh mới được đánh giá.
     */
    public function submitFeedback(Request $request, Event $event): JsonResponse
    {
        Event::syncStatuses();
        $event->refresh();

        abort_if($event->status->value !== 'ended', 422, 'Chỉ có thể đánh giá sau khi sự kiện đã kết thúc.');

        $user = $request->user();

        abort_if(
            ! $event->checkIns()->where('user_id', $user->id)->exists(),
            422,
            'Chỉ người đã tham dự sự kiện mới có thể gửi đánh giá.'
        );

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $feedback = EventFeedback::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id],
            [
                'rating'  => $data['rating'],
                'comment' => $data['comment'] ?? null,
                // Đặt lại trạng thái kiểm duyệt để nhận xét mới được chấm lại từ đầu.
                'is_hidden'         => false,
                'moderation_reason' => null,
                'moderated_at'      => null,
            ],
        );

        // Kiểm duyệt nhận xét bằng AI chạy nền (chỉ khi có nội dung chữ).
        if (trim((string) $feedback->comment) !== '') {
            ModerateEventFeedbackJob::dispatch($feedback->id);
        }

        return $this->successResponse(true, [
            'rating' => $feedback->rating,
            'comment' => $feedback->comment,
        ], 'Cảm ơn bạn đã gửi đánh giá!');
    }

    /**
     * Tổng hợp điểm đánh giá: trung bình, tổng số và phân phối theo từng mức sao.
     */
    private function feedbackSummary(Event $event): array
    {
        // Đánh giá bị ẩn do kiểm duyệt không tính vào thống kê công khai
        // để điểm trung bình / phân bố sao khớp với danh sách hiển thị.
        $ratings = $event->feedbacks()->where('is_hidden', false)->pluck('rating');
        $total = $ratings->count();

        $distribution = [];
        foreach (range(1, 5) as $star) {
            $distribution[$star] = $ratings->filter(fn ($r) => (int) $r === $star)->count();
        }

        return [
            'average_rating' => $total > 0 ? round($ratings->avg(), 1) : 0,
            'total' => $total,
            'distribution' => $distribution,
        ];
    }

    public function register(Request $request, Event $event): JsonResponse
    {
        Event::syncStatuses();
        $event->refresh();

        abort_if($event->status->value !== 'published', 422, 'Sự kiện này hiện không mở đăng ký.');
        abort_if(
            $event->registration_start_at && now()->lt($event->registration_start_at),
            422,
            'Sự kiện chưa mở đăng ký. Vui lòng quay lại sau.'
        );
        abort_if(
            $event->registration_end_at && now()->gt($event->registration_end_at),
            422,
            'Đã hết thời gian đăng ký tham gia sự kiện.'
        );
        abort_if($event->isFull(), 422, 'Sự kiện đã đủ số lượng người tham dự.');

        $user = $request->user();

        // Thành viên CLB = có bất kỳ vai trò nào ngoài "user" thường
        $memberRoles = array_values(array_filter(
            array_map(fn (RolesEnum $case) => $case->value, RolesEnum::cases()),
            fn (string $role) => $role !== RolesEnum::USER->value,
        ));
        $isClubMember = $user->hasAnyRole($memberRoles);

        // Thành viên CLB được miễn kiểm tra email sinh viên
        abort_if(
            ! $isClubMember && ! str_ends_with(strtolower((string) $user->email), '@caothang.edu.vn'),
            422,
            'Chỉ tài khoản email sinh viên Cao Thắng (@caothang.edu.vn) mới được đăng ký tham gia sự kiện.'
        );

        abort_if(
            $event->is_members_only && ! $isClubMember,
            422,
            'Sự kiện này chỉ dành cho thành viên câu lạc bộ.'
        );

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
        Event::syncStatuses();
        $event->refresh();

        abort_if($event->status->value !== 'published', 422, 'Không thể hủy đăng ký khi sự kiện đã bắt đầu.');

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
            'thumbnail' => $event->thumbnailUrl(),
            'start_at' => $event->start_at?->toIso8601String(),
            'end_at' => $event->end_at?->toIso8601String(),
            'registration_start_at' => $event->registration_start_at?->toIso8601String(),
            'registration_end_at' => $event->registration_end_at?->toIso8601String(),
            'location' => $event->location,
            'max_attendees' => $event->max_attendees,
            'is_members_only' => (bool) $event->is_members_only,
            'is_registration_open' => $event->isRegistrationOpen(),
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
