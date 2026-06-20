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
use Illuminate\Support\Facades\Storage;

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
        ];
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
