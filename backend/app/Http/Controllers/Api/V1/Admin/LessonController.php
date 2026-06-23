<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\LessonSectionType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\LessonProgress;
use App\Models\LessonQrTicket;
use App\Services\CourseCompletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        if ($enrollment = $course->enrollmentFor($ticket->user_id)) {
            app(CourseCompletionService::class)->recalc($enrollment);
        }

        $user = $ticket->user;
        $payload = [
            'already' => ! $attendance->wasRecentlyCreated,
            'student' => [
                'id' => $user?->id,
                'full_name' => $user?->full_name,
                'email' => $user?->email,
                'avatar' => $this->resolveAvatar($user?->avatar),
            ],
        ];

        $message = $attendance->wasRecentlyCreated
            ? 'Điểm danh thành công.'
            : 'Học viên đã được điểm danh trước đó.';

        return $this->successResponse(true, $payload, $message);
    }

    /**
     * Danh sách học viên track offline đã ghi danh + điểm bài tập hiện tại (nếu có) của buổi học.
     * Chấm bài chỉ áp dụng cho track offline (online tính tiến độ theo % xem video).
     */
    public function grades(Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $scores = LessonProgress::query()
            ->where('lesson_id', $lesson->id)
            ->where('section_type', LessonSectionType::ASSIGNMENT)
            ->pluck('score', 'user_id');

        $students = $course->enrollments()
            ->where('track', 'offline')
            ->with('user:id,full_name,email,avatar')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($e) => [
                'user_id' => $e->user_id,
                'full_name' => $e->user?->full_name,
                'email' => $e->user?->email,
                'avatar' => $this->resolveAvatar($e->user?->avatar),
                'track' => $e->track,
                'score' => isset($scores[$e->user_id]) ? (float) $scores[$e->user_id] : null,
            ])
            ->all();

        return $this->successResponse(true, $students, ApiMessage::RETRIEVED);
    }

    /**
     * Lưu điểm bài tập cho nhiều học viên track offline cùng lúc. score = null → bỏ điểm (chưa chấm).
     * is_completed tính theo ngưỡng của LessonSectionType::ASSIGNMENT (80đ).
     */
    public function saveGrades(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $data = $request->validate([
            'grades' => 'required|array',
            'grades.*.user_id' => 'required|integer',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

        $offlineUserIds = $course->enrollments()->where('track', 'offline')->pluck('user_id')->all();
        $threshold = LessonSectionType::ASSIGNMENT->completionThreshold();

        DB::transaction(function () use ($data, $lesson, $offlineUserIds, $threshold) {
            foreach ($data['grades'] as $grade) {
                abort_if(
                    ! in_array($grade['user_id'], $offlineUserIds, true),
                    422,
                    'Chỉ chấm bài tập cho học viên track offline.'
                );

                if ($grade['score'] === null) {
                    LessonProgress::where([
                        'user_id' => $grade['user_id'],
                        'lesson_id' => $lesson->id,
                        'section_type' => LessonSectionType::ASSIGNMENT,
                    ])->delete();

                    continue;
                }

                $isCompleted = $grade['score'] >= $threshold;

                LessonProgress::updateOrCreate(
                    [
                        'user_id' => $grade['user_id'],
                        'lesson_id' => $lesson->id,
                        'section_type' => LessonSectionType::ASSIGNMENT,
                    ],
                    [
                        'score' => $grade['score'],
                        'is_completed' => $isCompleted,
                        'completed_at' => $isCompleted ? now() : null,
                    ],
                );
            }
        });

        $affectedUserIds = collect($data['grades'])->pluck('user_id')->unique();
        $completionService = app(CourseCompletionService::class);
        $course->enrollments()
            ->whereIn('user_id', $affectedUserIds)
            ->get()
            ->each(fn ($enrollment) => $completionService->recalc($enrollment));

        return $this->grades($course, $lesson);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function assertBelongsTo(Course $course, Lesson $lesson): void
    {
        abort_if($lesson->course_id !== $course->id, 404, 'Buổi học không thuộc khóa học này.');
    }

    private function resolveAvatar(?string $avatar): ?string
    {
        if (! $avatar) {
            return null;
        }

        return str_starts_with($avatar, 'http') || str_starts_with($avatar, '/')
            ? $avatar
            : Storage::disk('public')->url($avatar);
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
