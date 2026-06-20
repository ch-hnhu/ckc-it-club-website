<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\LessonQrTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LessonController extends BaseApiController
{
    /**
     * Chi tiết một buổi học (đầy đủ field) để prefill form sửa.
     */
    public function show(Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        return $this->successResponse(true, $this->transform($lesson), ApiMessage::RETRIEVED);
    }

    /**
     * Tạo buổi học mới trong khoá. order = max(order)+1.
     */
    public function store(Request $request, Course $course): JsonResponse
    {
        $this->nullifyEmpty($request);
        $data = $this->validateData($request);

        $lesson = Lesson::create([
            ...$data,
            'course_id' => $course->id,
            'slug' => $this->uniqueSlug($course, $data['title']),
            'order' => (int) $course->lessons()->max('order') + 1,
            'status' => $data['status'] ?? 'draft',
            'created_by' => $request->user()->id,
        ]);

        return $this->createdResponse($this->transform($lesson), 'Tạo buổi học thành công.');
    }

    /**
     * Cập nhật buổi học.
     */
    public function update(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);
        $this->nullifyEmpty($request);
        $data = $this->validateData($request, $lesson);

        $lesson->update([...$data, 'updated_by' => $request->user()->id]);

        return $this->successResponse(true, $this->transform($lesson->refresh()), 'Cập nhật buổi học thành công.');
    }

    /**
     * Xoá mềm buổi học.
     */
    public function destroy(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $lesson->deleted_by = $request->user()->id;
        $lesson->save();
        $lesson->delete();

        return $this->successResponse(true, null, 'Đã xóa buổi học.');
    }

    /**
     * Điểm danh buổi học bằng mã QR (token trên vé của học viên).
     * Tái dùng cho cả pattern Events: quét QR → tạo lesson_attendances.
     */
    public function checkIn(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $data = $request->validate([
            'qr_token' => 'required|string',
        ]);

        $ticket = LessonQrTicket::with('user:id,full_name,email,avatar')
            ->where('lesson_id', $lesson->id)
            ->where('token', $data['qr_token'])
            ->first();

        abort_if(! $ticket, 422, 'Mã QR không hợp lệ cho buổi học này.');

        $attendance = LessonAttendance::firstOrCreate(
            ['user_id' => $ticket->user_id, 'lesson_id' => $lesson->id],
            ['type' => 'qr', 'attended_at' => now(), 'recorded_by' => $request->user()->id],
        );

        if (! $ticket->used_at) {
            $ticket->update(['used_at' => now()]);
        }

        $user = $ticket->user;
        $payload = [
            'already' => ! $attendance->wasRecentlyCreated,
            'student' => [
                'id' => $user?->id,
                'full_name' => $user?->full_name,
                'email' => $user?->email,
                'avatar' => $user?->avatar
                    ? (str_starts_with($user->avatar, 'http') || str_starts_with($user->avatar, '/')
                        ? $user->avatar
                        : Storage::disk('public')->url($user->avatar))
                    : null,
            ],
        ];

        $message = $attendance->wasRecentlyCreated
            ? 'Điểm danh thành công.'
            : 'Học viên đã được điểm danh trước đó.';

        return $this->successResponse(true, $payload, $message);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function assertBelongsTo(Course $course, Lesson $lesson): void
    {
        abort_if($lesson->course_id !== $course->id, 404, 'Buổi học không thuộc khóa học này.');
    }

    /**
     * @return array<string,mixed>
     */
    private function validateData(Request $request, ?Lesson $lesson = null): array
    {
        $titleRule = $lesson ? 'sometimes|required|string|max:255' : 'required|string|max:255';

        return $request->validate([
            'title' => $titleRule,
            'description' => 'nullable|string|max:5000',
            'status' => 'nullable|in:draft,published',
            'session_start' => 'nullable|date',
            'session_end' => 'nullable|date|after_or_equal:session_start',
            'resource_url' => 'nullable|url|max:2048',
            'resource_label' => 'nullable|string|max:255',
            'video_url' => 'nullable|url|max:2048',
            'video_duration' => 'nullable|integer|min:0|max:86400',
            'live_url' => 'nullable|url|max:2048',
            'document' => 'nullable|string',
            'assignment_url' => 'nullable|url|max:2048',
            'assignment_deadline' => 'nullable|date',
        ]);
    }

    private function nullifyEmpty(Request $request): void
    {
        $fields = [
            'description', 'session_start', 'session_end', 'resource_url', 'resource_label',
            'video_url', 'video_duration', 'live_url', 'document', 'assignment_url', 'assignment_deadline',
        ];

        $request->merge(
            collect($request->only($fields))
                ->map(fn ($v) => $v === '' ? null : $v)
                ->all()
        );
    }

    private function uniqueSlug(Course $course, string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'buoi-hoc';
        $slug = $base;
        $i = 1;

        while (
            Lesson::withTrashed()
                ->where('course_id', $course->id)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . (++$i);
        }

        return $slug;
    }

    private function transform(Lesson $lesson): array
    {
        return [
            'id' => $lesson->id,
            'course_id' => $lesson->course_id,
            'order' => $lesson->order,
            'title' => $lesson->title,
            'slug' => $lesson->slug,
            'description' => $lesson->description,
            'status' => $lesson->status->value,
            'session_start' => $lesson->session_start?->toIso8601String(),
            'session_end' => $lesson->session_end?->toIso8601String(),
            'resource_url' => $lesson->resource_url,
            'resource_label' => $lesson->resource_label,
            'video_url' => $lesson->video_url,
            'video_duration' => $lesson->video_duration,
            'live_url' => $lesson->live_url,
            'document' => $lesson->document,
            'assignment_url' => $lesson->assignment_url,
            'assignment_deadline' => $lesson->assignment_deadline?->toIso8601String(),
        ];
    }
}
