<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourseController extends BaseApiController
{
    /**
     * Danh sách khoá học cho trang quản trị. Trả về shape `AdminCourse[]`.
     * Mô hình song song: mỗi khoá có cả track offline & online; track gắn với
     * từng ghi danh (course_enrollments.track), không gắn vào khoá.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $search = $request->query('search');
        $status = $request->query('status');
        $level = $request->query('level');
        $offline = $request->query('offline'); // all | has_offline | online_only

        $sortable = [
            'id', 'title', 'level', 'status',
            'lessons_count', 'enrollments_count', 'enrollment_deadline', 'created_at',
        ];
        $sort = in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'created_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $courses = Course::query()
            ->with(['creator:id,full_name,avatar', 'tags:id,name'])
            ->withCount([
                'lessons as lessons_count',
                'enrollments as enrollments_count',
                'enrollments as offline_enrollments_count' => fn ($q) => $q->where('track', 'offline'),
                'enrollments as online_enrollments_count' => fn ($q) => $q->where('track', 'online'),
                'certificates as certificates_count',
            ])
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($level && $level !== 'all', fn ($q) => $q->where('level', $level))
            ->when($offline === 'has_offline', fn ($q) => $q->whereNotNull('max_offline_slots'))
            ->when($offline === 'online_only', fn ($q) => $q->whereNull('max_offline_slots'))
            ->orderBy($sort, $order)
            ->paginate($perPage);

        $courses->getCollection()->transform(fn (Course $c) => $this->transformCourse($c));

        return $this->paginatedResponse($courses, ApiMessage::RETRIEVED);
    }

    /**
     * Tạo khoá học mới. Mô hình song song: không mở lớp offline thì
     * max_offline_slots = null (khoá chỉ online).
     */
    public function store(Request $request): JsonResponse
    {
        $this->nullifyEmpty($request);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'level' => 'required|in:beginner,intermediate,advanced',
            'status' => 'nullable|in:draft,published',
            'enrollment_start' => 'nullable|date',
            'enrollment_deadline' => 'nullable|date|after_or_equal:enrollment_start',
            'course_end' => 'nullable|date|after_or_equal:enrollment_deadline',
            'max_offline_slots' => 'nullable|integer|min:1|max:1000',
            'max_absent_allowed' => 'nullable|integer|min:0|max:50',
            'quiz_pass_threshold' => 'nullable|integer|min:0|max:100',
            'thumbnail' => 'nullable|image|max:5120',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
        ]);

        // Không mở lớp offline → khoá chỉ online
        if ($request->has('has_offline') && ! $request->boolean('has_offline')) {
            $data['max_offline_slots'] = null;
        }

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('course-thumbnails', 'public');
        }

        $course = DB::transaction(function () use ($data, $thumbnailPath, $request) {
            $course = Course::create([
                'title' => $data['title'],
                'slug' => $this->generateUniqueSlug($data['title']),
                'description' => $data['description'] ?? null,
                'thumbnail' => $thumbnailPath,
                'level' => $data['level'],
                'status' => $data['status'] ?? 'draft',
                'enrollment_start' => $data['enrollment_start'] ?? null,
                'enrollment_deadline' => $data['enrollment_deadline'] ?? null,
                'course_end' => $data['course_end'] ?? null,
                'max_offline_slots' => $data['max_offline_slots'] ?? null,
                'max_absent_allowed' => $data['max_absent_allowed'] ?? 1,
                'quiz_pass_threshold' => $data['quiz_pass_threshold'] ?? 80,
                'created_by' => $request->user()->id,
            ]);

            if (! empty($data['tag_ids'])) {
                $course->tags()->sync($data['tag_ids']);
            }

            return $course;
        });

        $course->load(['creator:id,full_name,avatar', 'tags:id,name'])
            ->loadCount([
                'lessons as lessons_count',
                'enrollments as enrollments_count',
                'enrollments as offline_enrollments_count' => fn ($q) => $q->where('track', 'offline'),
                'enrollments as online_enrollments_count' => fn ($q) => $q->where('track', 'online'),
                'certificates as certificates_count',
            ]);

        return $this->createdResponse($this->transformCourse($course), 'Tạo khóa học thành công.');
    }

    /**
     * Cập nhật khoá học. Gọi qua POST + _method=PUT (multipart) khi có thumbnail.
     */
    public function update(Request $request, Course $course): JsonResponse
    {
        $this->nullifyEmpty($request);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'level' => 'sometimes|required|in:beginner,intermediate,advanced',
            'status' => 'sometimes|required|in:draft,published',
            'enrollment_start' => 'nullable|date',
            'enrollment_deadline' => 'nullable|date|after_or_equal:enrollment_start',
            'course_end' => 'nullable|date|after_or_equal:enrollment_deadline',
            'max_offline_slots' => 'nullable|integer|min:1|max:1000',
            'max_absent_allowed' => 'nullable|integer|min:0|max:50',
            'quiz_pass_threshold' => 'nullable|integer|min:0|max:100',
            'thumbnail' => 'nullable|image|max:5120',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
        ]);

        // Thumbnail: thay mới / gỡ bỏ / giữ nguyên
        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('course-thumbnails', 'public');
        } elseif ($request->boolean('remove_thumbnail')) {
            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
            $data['thumbnail'] = null;
        } else {
            unset($data['thumbnail']);
        }

        // Không mở lớp offline → khoá chỉ online
        if ($request->has('has_offline') && ! $request->boolean('has_offline')) {
            $data['max_offline_slots'] = null;
        }

        $tagIds = $data['tag_ids'] ?? null;
        unset($data['tag_ids']);

        DB::transaction(function () use ($course, $data, $tagIds, $request) {
            $course->update([...$data, 'updated_by' => $request->user()->id]);

            if ($request->has('tag_ids') || $tagIds !== null) {
                $course->tags()->sync($tagIds ?? []);
            }
        });

        $course->refresh()
            ->load(['creator:id,full_name,avatar', 'tags:id,name'])
            ->loadCount([
                'lessons as lessons_count',
                'enrollments as enrollments_count',
                'enrollments as offline_enrollments_count' => fn ($q) => $q->where('track', 'offline'),
                'enrollments as online_enrollments_count' => fn ($q) => $q->where('track', 'online'),
                'certificates as certificates_count',
            ]);

        return $this->successResponse(true, $this->transformCourse($course), 'Cập nhật khóa học thành công.');
    }

    /**
     * Xoá mềm khoá học (chuyển vào thùng rác).
     */
    public function destroy(Request $request, Course $course): JsonResponse
    {
        $course->deleted_by = $request->user()->id;
        $course->save();
        $course->delete();

        return $this->successResponse(true, null, 'Đã xóa khóa học.');
    }

    /**
     * Danh sách khoá học trong thùng rác (đã xoá mềm).
     */
    public function trash(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $search = $request->query('search');

        $courses = Course::onlyTrashed()
            ->with(['creator:id,full_name,avatar', 'tags:id,name'])
            ->withCount($this->courseCounts())
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->orderByDesc('deleted_at')
            ->paginate($perPage);

        $courses->getCollection()->transform(fn (Course $c) => $this->transformCourse($c));

        return $this->paginatedResponse($courses, ApiMessage::RETRIEVED);
    }

    /**
     * Khôi phục khoá học từ thùng rác.
     */
    public function restore(int $id): JsonResponse
    {
        $course = Course::onlyTrashed()->findOrFail($id);
        $course->restore();
        $course->deleted_by = null;
        $course->save();

        $course->load(['creator:id,full_name,avatar', 'tags:id,name'])
            ->loadCount($this->courseCounts());

        return $this->successResponse(true, $this->transformCourse($course), 'Khôi phục khóa học thành công.');
    }

    /**
     * Xoá vĩnh viễn khoá học.
     */
    public function forceDelete(int $id): JsonResponse
    {
        $course = Course::onlyTrashed()->findOrFail($id);

        if ($course->thumbnail) {
            Storage::disk('public')->delete($course->thumbnail);
        }

        $course->forceDelete();

        return $this->successResponse(true, null, 'Xóa vĩnh viễn khóa học thành công.');
    }

    /**
     * Chi tiết khoá học cho trang quản trị. Trả về shape `AdminCourseDetail`
     * (AdminCourse + lessons[] + enrollments[] + certificates[]).
     */
    public function show(Course $course): JsonResponse
    {
        $course->load(['creator:id,full_name,avatar', 'tags:id,name'])
            ->loadCount([
                'lessons as lessons_count',
                'enrollments as enrollments_count',
                'enrollments as offline_enrollments_count' => fn ($q) => $q->where('track', 'offline'),
                'enrollments as online_enrollments_count' => fn ($q) => $q->where('track', 'online'),
                'certificates as certificates_count',
            ]);

        $lessons = $course->lessons()
            ->withCount('attendances as attendances_count')
            ->orderBy('order')
            ->get();

        $enrollments = $course->enrollments()
            ->with('user:id,full_name,email,avatar')
            ->orderByDesc('created_at')
            ->get();

        $certificates = $course->certificates()
            ->with('user:id,full_name,email')
            ->orderByDesc('issued_at')
            ->get();

        // Số buổi vắng (offline): tính trên các buổi offline đã kết thúc.
        $now = now();
        $pastOfflineLessonIds = $lessons
            ->filter(fn (Lesson $l) => $l->session_end && $l->session_end->lt($now))
            ->pluck('id');
        $pastOfflineCount = $pastOfflineLessonIds->count();

        $attendedByUser = $pastOfflineCount > 0
            ? LessonAttendance::query()
                ->whereIn('lesson_id', $pastOfflineLessonIds)
                ->selectRaw('user_id, count(*) as c')
                ->groupBy('user_id')
                ->pluck('c', 'user_id')
                ->all()
            : [];

        $data = array_merge($this->transformCourse($course), [
            'lessons' => $lessons->map(fn (Lesson $l) => [
                'id' => $l->id,
                'order' => $l->order,
                'title' => $l->title,
                'status' => $l->status->value,
                'session_start' => $l->session_start?->toIso8601String(),
                'session_end' => $l->session_end?->toIso8601String(),
                'has_video' => (bool) $l->playableVideoUrl(),
                'has_document' => (bool) $l->document,
                'has_assignment' => (bool) $l->assignment_url,
                'attendances_count' => (int) ($l->attendances_count ?? 0),
            ])->all(),
            'enrollments' => $enrollments->map(function (CourseEnrollment $e) use ($attendedByUser, $pastOfflineCount) {
                $absent = 0;
                if ($e->track === 'offline') {
                    $attended = (int) ($attendedByUser[$e->user_id] ?? 0);
                    $absent = max(0, $pastOfflineCount - $attended);
                }

                return [
                    'id' => $e->id,
                    'user' => [
                        'id' => $e->user?->id,
                        'full_name' => $e->user?->full_name,
                        'email' => $e->user?->email,
                        'avatar' => $this->resolveUrl($e->user?->avatar),
                    ],
                    'track' => $e->track,
                    'progress' => (int) $e->progress,
                    'absent_count' => $absent,
                    'completed_at' => $e->completed_at?->toIso8601String(),
                    'enrolled_at' => $e->created_at?->toIso8601String(),
                ];
            })->all(),
            'certificates' => $certificates->map(fn (CourseCertificate $cert) => [
                'id' => $cert->id,
                'cert_code' => $cert->cert_code,
                'user' => [
                    'id' => $cert->user?->id,
                    'full_name' => $cert->user?->full_name,
                    'email' => $cert->user?->email,
                ],
                'track' => $cert->track,
                'issued_at' => $cert->issued_at?->toIso8601String(),
            ])->all(),
        ]);

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Map Course → shape `AdminCourse` (dòng trong bảng quản lý).
     */
    private function transformCourse(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'description' => $course->description,
            'thumbnail' => $this->resolveUrl($course->thumbnail),
            'level' => $course->level->value,
            'status' => $course->status->value,
            'enrollment_start' => $course->enrollment_start?->toIso8601String(),
            'enrollment_deadline' => $course->enrollment_deadline?->toIso8601String(),
            'course_end' => $course->course_end?->toIso8601String(),
            'max_offline_slots' => $course->max_offline_slots,
            'max_absent_allowed' => $course->max_absent_allowed,
            'quiz_pass_threshold' => $course->quiz_pass_threshold,
            'creator' => $course->creator ? [
                'id' => $course->creator->id,
                'full_name' => $course->creator->full_name,
                'avatar' => $this->resolveUrl($course->creator->avatar),
            ] : null,
            'categories' => $course->tags->map(fn (Tag $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'color' => null,
            ])->all(),
            'lessons_count' => (int) ($course->lessons_count ?? 0),
            'enrollments_count' => (int) ($course->enrollments_count ?? 0),
            'offline_enrollments_count' => (int) ($course->offline_enrollments_count ?? 0),
            'online_enrollments_count' => (int) ($course->online_enrollments_count ?? 0),
            'certificates_count' => (int) ($course->certificates_count ?? 0),
            'created_at' => $course->created_at?->toIso8601String(),
            'updated_at' => $course->updated_at?->toIso8601String(),
            'deleted_at' => $course->deleted_at?->toIso8601String(),
        ];
    }

    /**
     * Định nghĩa các count tổng hợp dùng chung cho withCount/loadCount.
     *
     * @return array<int|string,mixed>
     */
    private function courseCounts(): array
    {
        return [
            'lessons as lessons_count',
            'enrollments as enrollments_count',
            'enrollments as offline_enrollments_count' => fn ($q) => $q->where('track', 'offline'),
            'enrollments as online_enrollments_count' => fn ($q) => $q->where('track', 'online'),
            'certificates as certificates_count',
        ];
    }

    /**
     * Chuyển chuỗi rỗng "" thành null cho các field nullable (cho phép xóa khi sửa).
     */
    private function nullifyEmpty(Request $request): void
    {
        $fields = ['description', 'enrollment_start', 'enrollment_deadline', 'course_end'];

        $request->merge(
            collect($request->only($fields))
                ->map(fn ($v) => $v === '' ? null : $v)
                ->all()
        );
    }

    /**
     * Sinh slug duy nhất từ tiêu đề khoá học.
     */
    private function generateUniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'khoa-hoc';
        $slug = $base;
        $i = 1;

        while (Course::where('slug', $slug)->exists()) {
            $slug = $base . '-' . (++$i);
        }

        return $slug;
    }

    /**
     * Chuẩn hoá đường dẫn ảnh/avatar.
     */
    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
