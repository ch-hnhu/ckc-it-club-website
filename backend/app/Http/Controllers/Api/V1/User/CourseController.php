<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\CourseStatus;
use App\Enums\LessonSectionType;
use App\Enums\RolesEnum;
use App\Enums\TagModelType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseFollower;
use App\Models\Lesson;
use App\Models\LessonQrTicket;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CourseController extends BaseApiController
{
    /**
     * Danh sách khoá học đã xuất bản (catalog). Trả về shape `Course[]`.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 9), 50);
        $search = $request->query('search');
        $category = $request->query('category');
        $level = $request->query('level');
        $sort = in_array($request->query('sort'), ['created_at', 'enrolled_count'], true)
            ? $request->query('sort')
            : 'created_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $query = Course::query()
            ->where('status', CourseStatus::PUBLISHED->value)
            ->with(['creator:id,full_name,avatar,username', 'tags:id,name'])
            ->withCount([
                'lessons as lessons_count' => fn ($q) => $q->where('status', CourseStatus::PUBLISHED->value),
                'enrollments as enrolled_count',
                'followers as followers_count',
            ])
            ->withSum([
                'lessons as total_video_seconds' => fn ($q) => $q->where('status', CourseStatus::PUBLISHED->value),
            ], 'video_duration')
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->when($level, fn ($q) => $q->where('level', $level))
            ->when($category, fn ($q) => $q->whereHas(
                'tags',
                fn ($t) => $t->where('name', $category)->where('model_type', TagModelType::COURSE->value)
            ));

        $query->when(
            $sort === 'enrolled_count',
            fn ($q) => $q->orderBy('enrolled_count', $order),
            fn ($q) => $q->orderBy('created_at', $order),
        );

        $userId = auth('sanctum')->id();
        $query->when($userId, fn ($q) => $q->withExists([
            'followers as is_interested' => fn ($f) => $f->where('user_id', $userId),
        ]));

        $courses = $query->paginate($perPage);

        $courses->getCollection()->transform(fn (Course $c) => $this->transformCourseCard($c, $userId));

        return $this->paginatedResponse($courses, 'Lấy danh sách khoá học thành công.');
    }

    /**
     * Danh mục (category) khoá học = các tag thuộc model_type = course.
     */
    public function categories(): JsonResponse
    {
        $categories = Tag::query()
            ->where('model_type', TagModelType::COURSE->value)
            ->orderBy('name')
            ->get()
            ->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => null,
            ])
            ->all();

        return $this->successResponse(true, $categories, 'Lấy danh mục khoá học thành công.');
    }

    /**
     * Trang tổng quan khoá học. Trả về shape `CourseDetail`.
     */
    public function show(Request $request, Course $course): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $course->load(['creator:id,full_name,avatar,username', 'tags:id,name']);
        $userId = auth('sanctum')->id();
        $enrollment = $course->enrollmentFor($userId);

        $lessons = $course->lessons()
            ->where('status', CourseStatus::PUBLISHED->value)
            ->with('quiz')
            ->get();

        // Aggregate mà transformCourseCard cần (show() không đi qua withCount/withSum của index()).
        $course->setAttribute('enrolled_count', $course->enrollments()->count());
        $course->setAttribute('total_video_seconds', (int) $lessons->sum('video_duration'));
        $course->setAttribute('followers_count', $course->followers()->count());
        $course->setAttribute('is_interested', $course->isFollowedBy($userId));

        $card = $this->transformCourseCard($course, $userId, $lessons->count());

        $data = array_merge($card, [
            'description' => $course->description ?? '',
            'enrollment_track' => $enrollment?->track,
            'enrollment_start' => $course->enrollment_start?->toIso8601String(),
            'enrollment_deadline' => $course->enrollment_deadline?->toIso8601String(),
            'course_end' => $course->course_end?->toIso8601String(),
            'lessons' => $lessons->map(fn (Lesson $l) => $this->transformLessonRow($l, $userId, $enrollment?->track))->all(),
            'stats' => $this->buildStats($course, $lessons, $userId),
        ]);

        return $this->successResponse(true, $data, 'Lấy thông tin khoá học thành công.');
    }

    /**
     * Chi tiết một buổi học. Trả về shape `LessonDetail`.
     */
    public function lesson(Request $request, Course $course, string $lessonSlug): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $lessons = $course->lessons()->where('status', CourseStatus::PUBLISHED->value)->get();
        $idx = $lessons->search(fn (Lesson $l) => $l->slug === $lessonSlug);
        abort_if($idx === false, 404, 'Không tìm thấy buổi học.');

        /** @var Lesson $lesson */
        $lesson = $lessons[$idx];
        $lesson->load('quiz.questions');
        $userId = auth('sanctum')->id();
        $enrollment = $course->enrollmentFor($userId);

        $progress = $this->lessonProgressPercent($lesson, $userId);
        $sections = $this->sectionCompletionMap($lesson, $userId);

        $prev = $idx > 0 ? $lessons[$idx - 1] : null;
        $next = $idx < $lessons->count() - 1 ? $lessons[$idx + 1] : null;

        $videoUrl = $lesson->playableVideoUrl();
        $quiz = $lesson->quiz;

        $data = [
            'id' => $lesson->id,
            'slug' => $lesson->slug,
            'order' => $lesson->order,
            'title' => $lesson->title,
            'summary' => $lesson->description,
            'session_start' => $lesson->session_start?->toIso8601String(),
            'progress' => $progress,
            'enrollment_track' => $enrollment?->track,
            'course' => [
                'slug' => $course->slug,
                'title' => $course->title,
                'level' => $course->level->value,
            ],
            'prev' => $prev ? ['slug' => $prev->slug, 'title' => $prev->title] : null,
            'next' => $next ? ['slug' => $next->slug, 'title' => $next->title] : null,
            'video' => $videoUrl ? [
                'id' => $lesson->id,
                'slug' => 'video',
                'title' => 'Bài giảng: ' . $lesson->title,
                'meta' => $this->formatDurationLabel($lesson->video_duration),
                'completed' => $sections['video'] ?? false,
                'url' => $videoUrl,
            ] : null,
            'reference' => $lesson->resource_url ? [
                'id' => $lesson->id,
                'title' => $lesson->resource_label ?: 'Tài nguyên tham khảo',
                'meta' => 'Tài liệu',
                'url' => $lesson->resource_url,
                'completed' => false,
            ] : null,
            'exercise' => $lesson->assignment_url ? [
                'id' => $lesson->id,
                'title' => 'Bài tập thực hành',
                'meta' => $lesson->assignment_deadline
                    ? 'Hạn nộp ' . $lesson->assignment_deadline->format('d/m/Y')
                    : 'Google Forms',
                'url' => $lesson->assignment_url,
                'completed' => $sections['assignment'] ?? false,
                'deadline' => $lesson->assignment_deadline?->toIso8601String(),
            ] : null,
            'quiz' => $quiz ? [
                'id' => $quiz->id,
                'slug' => 'quiz',
                'title' => 'Quiz kiểm tra: ' . $lesson->title,
                'meta' => $quiz->questions->count() . ' câu hỏi',
                'completed' => $sections['quiz'] ?? false,
            ] : null,
        ];

        return $this->successResponse(true, $data, 'Lấy thông tin buổi học thành công.');
    }

    /**
     * Trang xem video bài giảng. Trả về shape `VideoDetail`.
     * Mỗi buổi học hiện chỉ có 1 video (schema), nên playlist chỉ gồm 1 mục.
     */
    public function video(Request $request, Course $course, string $lessonSlug, string $videoSlug): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $lessons = $course->lessons()->where('status', CourseStatus::PUBLISHED->value)->get();
        $idx = $lessons->search(fn (Lesson $l) => $l->slug === $lessonSlug);
        abort_if($idx === false, 404, 'Không tìm thấy buổi học.');

        /** @var Lesson $lesson */
        $lesson = $lessons[$idx];
        $videoUrl = $lesson->playableVideoUrl();
        abort_if(! $videoUrl, 404, 'Buổi học này chưa có video bài giảng.');

        $userId = auth('sanctum')->id();
        $completed = ($this->sectionCompletionMap($lesson, $userId)['video'] ?? false);
        $prev = $idx > 0 ? $lessons[$idx - 1] : null;
        $next = $idx < $lessons->count() - 1 ? $lessons[$idx + 1] : null;

        $data = [
            'id' => $lesson->id,
            'slug' => 'video',
            'title' => 'Bài giảng: ' . $lesson->title,
            // Tài liệu markdown hiển thị ở cột trái
            'document' => $lesson->document,
            // 2 nguồn video: bản chính thức (ưu tiên) và bản ghi livestream (fallback / tab phụ)
            'lecture_url' => $lesson->video_url,
            'live_url' => $lesson->live_url,
            'duration' => $this->formatDurationClock($lesson->video_duration),
            'xp' => 0, // TODO(G2): tích hợp gamification
            'completed' => $completed,
            'course' => ['slug' => $course->slug, 'title' => $course->title],
            'lesson' => ['slug' => $lesson->slug, 'title' => $lesson->title, 'order' => $lesson->order],
            'prev_lesson' => $prev ? ['slug' => $prev->slug, 'title' => $prev->title] : null,
            'next_lesson' => $next ? ['slug' => $next->slug, 'title' => $next->title] : null,
        ];

        return $this->successResponse(true, $data, 'Lấy thông tin video thành công.');
    }

    /**
     * Ghi danh khoá học theo hình thức (track) offline hoặc online.
     *
     * - offline: chỉ trong cửa sổ ghi danh (enrollment_start..enrollment_deadline),
     *   giới hạn `max_offline_slots`, chống race bằng khoá hàng trong transaction.
     * - online: mở tới khi khoá kết thúc (course_end).
     *
     * Điều kiện tư cách giống Sự kiện: email sinh viên Cao Thắng hoặc thành viên CLB.
     */
    public function enroll(Request $request, Course $course): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $validated = $request->validate([
            'track' => ['required', 'in:offline,online'],
        ]);
        $track = $validated['track'];

        $user = $request->user();

        // Thành viên CLB = có bất kỳ vai trò nào ngoài "user" thường
        $memberRoles = array_values(array_filter(
            array_map(fn (RolesEnum $case) => $case->value, RolesEnum::cases()),
            fn (string $role) => $role !== RolesEnum::USER->value,
        ));
        $isClubMember = $user->hasAnyRole($memberRoles);

        abort_if(
            ! $isClubMember && ! str_ends_with(strtolower((string) $user->email), '@caothang.edu.vn'),
            422,
            'Chỉ tài khoản email sinh viên Cao Thắng (@caothang.edu.vn) hoặc thành viên CLB mới được ghi danh khoá học.'
        );

        // Đã ghi danh rồi → chặn (đổi/thêm track còn chờ chốt nghiệp vụ)
        if ($course->enrollmentFor($user->id)) {
            return $this->errorResponse(false, 'Bạn đã ghi danh khoá học này rồi.', 422);
        }

        $now = now();

        if ($track === 'offline') {
            abort_if($course->max_offline_slots === null, 422, 'Khoá học này không mở lớp offline.');
            abort_if(
                $course->enrollment_start && $now->lt($course->enrollment_start),
                422,
                'Khoá học chưa mở ghi danh. Vui lòng quay lại sau.'
            );
            abort_if(
                $course->enrollment_deadline && $now->gt($course->enrollment_deadline),
                422,
                'Đã hết hạn ghi danh lớp offline.'
            );

            $enrollment = DB::transaction(function () use ($course, $user) {
                $taken = $course->enrollments()
                    ->where('track', 'offline')
                    ->lockForUpdate()
                    ->count();

                abort_if(
                    $taken >= $course->max_offline_slots,
                    422,
                    'Lớp offline đã đủ số lượng học viên.'
                );

                return CourseEnrollment::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'track' => 'offline',
                    'progress' => 0,
                ]);
            });
        } else {
            abort_if(
                $course->course_end && $now->gt($course->course_end),
                422,
                'Khoá học đã kết thúc, không thể ghi danh học online.'
            );

            $enrollment = CourseEnrollment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'track' => 'online',
                'progress' => 0,
            ]);
        }

        return $this->createdResponse(['track' => $enrollment->track], 'Ghi danh khoá học thành công.');
    }

    /**
     * Bật/tắt trạng thái "quan tâm" khoá học của user hiện tại.
     */
    public function toggleFollow(Request $request, Course $course): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $userId = $request->user()->id;

        $existing = $course->followers()->where('user_id', $userId)->first();

        if ($existing) {
            $existing->delete();
            $isInterested = false;
        } else {
            CourseFollower::create(['user_id' => $userId, 'course_id' => $course->id]);
            $isInterested = true;
        }

        return $this->successResponse(
            true,
            [
                'is_interested' => $isInterested,
                'followers_count' => $course->followers()->count(),
            ],
            $isInterested ? 'Đã thêm vào danh sách quan tâm.' : 'Đã bỏ quan tâm khoá học.',
        );
    }

    /**
     * Đăng ký "sẽ tham gia" một buổi học offline → cấp vé QR điểm danh.
     * Idempotent: nếu đã có vé thì trả lại vé cũ (token + used_at).
     */
    public function createQrTicket(Request $request, Course $course, string $lessonSlug): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $lesson = $course->lessons()
            ->where('status', CourseStatus::PUBLISHED->value)
            ->where('slug', $lessonSlug)
            ->first();
        abort_if(! $lesson, 404, 'Không tìm thấy buổi học.');

        $userId = $request->user()->id;

        // Vé QR chỉ dành cho học viên đã ghi danh lớp offline.
        $enrollment = $course->enrollmentFor($userId);
        abort_if(
            ! $enrollment || $enrollment->track !== 'offline',
            422,
            'Chỉ học viên đã ghi danh lớp offline mới có thể đăng ký tham gia buổi học.'
        );

        // Buổi đã kết thúc thì không cấp vé mới nữa.
        abort_if(
            $lesson->session_end && now()->gt($lesson->session_end),
            422,
            'Buổi học đã kết thúc, không thể đăng ký tham gia.'
        );

        $ticket = LessonQrTicket::firstOrCreate(
            ['user_id' => $userId, 'lesson_id' => $lesson->id],
            ['token' => LessonQrTicket::generateToken($lesson->id, $userId)],
        );

        return $this->successResponse(
            true,
            ['token' => $ticket->token, 'used_at' => $ticket->used_at?->toIso8601String()],
            'Đã đăng ký tham gia buổi học. Xuất trình mã QR để điểm danh.',
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Map Course → shape `Course` (card). $lessonsCount cho phép override khi đã load sẵn.
     */
    private function transformCourseCard(Course $course, ?int $userId, ?int $lessonsCount = null): array
    {
        $progress = $course->enrollmentFor($userId)?->progress;

        return [
            'id' => $course->id,
            'slug' => $course->slug,
            'title' => $course->title,
            'excerpt' => $course->description ? mb_substr($course->description, 0, 160) : null,
            'thumbnail' => $this->resolveUrl($course->thumbnail),
            'level' => $course->level->value,
            'instructor' => $course->creator ? [
                'id' => $course->creator->id,
                'full_name' => $course->creator->full_name,
                'avatar' => $this->resolveUrl($course->creator->avatar),
                'username' => $course->creator->username,
            ] : null,
            'lessons_count' => $lessonsCount ?? (int) ($course->lessons_count ?? 0),
            'duration_minutes' => (int) round(((int) ($course->total_video_seconds ?? 0)) / 60),
            'enrolled_count' => (int) ($course->enrolled_count ?? 0),
            'followers_count' => (int) ($course->followers_count ?? 0),
            'categories' => $course->tags->map(fn (Tag $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'color' => null,
            ])->all(),
            'progress' => $progress !== null ? (int) $progress : null,
            'is_interested' => (bool) ($course->is_interested ?? false),
            'created_at' => $course->created_at?->toIso8601String(),
            'updated_at' => $course->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Map Lesson → shape `CourseLesson` (dòng trong danh sách buổi học).
     */
    private function transformLessonRow(Lesson $lesson, ?int $userId, ?string $track): array
    {
        $sections = $this->sectionCompletionMap($lesson, $userId);
        $isCompleted = $this->lessonProgressPercent($lesson, $userId) === 100;

        $qrTicket = null;
        $isAttended = false;
        if ($userId && $track === 'offline') {
            $ticket = $lesson->qrTickets()->where('user_id', $userId)->first();
            $qrTicket = $ticket
                ? ['token' => $ticket->token, 'used_at' => $ticket->used_at?->toIso8601String()]
                : null;
            $isAttended = $lesson->attendances()->where('user_id', $userId)->exists();
        }

        return [
            'id' => $lesson->id,
            'slug' => $lesson->slug,
            'order' => $lesson->order,
            'title' => $lesson->title,
            'summary' => $lesson->description,
            'club_only' => false,
            'is_locked' => false,
            'completed' => $isCompleted,
            'items_count' => $lesson->itemsCount(),
            'session_start' => $lesson->session_start?->toIso8601String(),
            'session_end' => $lesson->session_end?->toIso8601String(),
            'qr_ticket' => $qrTicket,
            'is_attended' => $isAttended,
        ];
    }

    /**
     * Trạng thái hoàn thành từng section (video/assignment/quiz) của user trong buổi học.
     *
     * @return array<string,bool>
     */
    private function sectionCompletionMap(Lesson $lesson, ?int $userId): array
    {
        if (! $userId) {
            return [];
        }

        return $lesson->progress()
            ->where('user_id', $userId)
            ->where('is_completed', true)
            ->pluck('section_type')
            ->mapWithKeys(fn ($type) => [
                $type instanceof LessonSectionType ? $type->value : $type => true,
            ])
            ->all();
    }

    /**
     * % tiến độ buổi học = số section đã hoàn thành / số section có mặt (video/assignment/quiz).
     * null nếu buổi học chưa có section nào để tính tiến độ.
     */
    private function lessonProgressPercent(Lesson $lesson, ?int $userId): ?int
    {
        $present = [];
        if ($lesson->playableVideoUrl()) {
            $present[] = 'video';
        }
        if ($lesson->assignment_url) {
            $present[] = 'assignment';
        }
        $hasQuiz = $lesson->relationLoaded('quiz') ? (bool) $lesson->quiz : $lesson->quiz()->exists();
        if ($hasQuiz) {
            $present[] = 'quiz';
        }

        if (empty($present)) {
            return null;
        }

        $done = $this->sectionCompletionMap($lesson, $userId);
        $completed = count(array_intersect($present, array_keys($done)));

        return (int) round($completed / count($present) * 100);
    }

    /**
     * Thống kê tiến độ hiển thị ở sidebar trang tổng quan.
     */
    private function buildStats(Course $course, $lessons, ?int $userId): array
    {
        $attendanceTotal = $lessons->count();
        $exerciseLessons = $lessons->filter(fn (Lesson $l) => (bool) $l->assignment_url);
        $quizLessons = $lessons->filter(fn (Lesson $l) => (bool) $l->quiz);

        $attendanceDone = 0;
        $exercisesDone = 0;
        $quizzesDone = 0;

        if ($userId) {
            $lessonIds = $lessons->pluck('id');
            $attendanceDone = $course->lessons()
                ->whereIn('lessons.id', $lessonIds)
                ->whereHas('attendances', fn ($q) => $q->where('user_id', $userId))
                ->count();

            foreach ($exerciseLessons as $l) {
                if (($this->sectionCompletionMap($l, $userId)['assignment'] ?? false)) {
                    $exercisesDone++;
                }
            }
            foreach ($quizLessons as $l) {
                if (($this->sectionCompletionMap($l, $userId)['quiz'] ?? false)) {
                    $quizzesDone++;
                }
            }
        }

        return [
            'attendance_done' => $attendanceDone,
            'attendance_total' => $attendanceTotal,
            'exercises_done' => $exercisesDone,
            'exercises_total' => $exerciseLessons->count(),
            'projects_done' => 0,   // TODO(G2): chưa có schema project
            'projects_total' => 0,
            'quizzes_done' => $quizzesDone,
            'quizzes_total' => $quizLessons->count(),
            'xp_earned' => 0,       // TODO(G2): tích hợp gamification
            'xp_total' => 0,
            'badges_earned' => 0,
            'badges_total' => 0,
        ];
    }

    /**
     * Định dạng nhãn thời lượng dạng "X phút" từ số giây.
     */
    private function formatDurationLabel(?int $seconds): string
    {
        if (! $seconds) {
            return '—';
        }

        return max(1, (int) round($seconds / 60)) . ' phút';
    }

    /**
     * Định dạng thời lượng dạng đồng hồ "MM:SS" hoặc "H:MM:SS".
     */
    private function formatDurationClock(?int $seconds): string
    {
        $seconds = (int) $seconds;
        $h = intdiv($seconds, 3600);
        $m = intdiv($seconds % 3600, 60);
        $s = $seconds % 60;

        return $h > 0
            ? sprintf('%d:%02d:%02d', $h, $m, $s)
            : sprintf('%d:%02d', $m, $s);
    }

    /**
     * Chuẩn hoá đường dẫn ảnh/avatar: giữ nguyên URL tuyệt đối & /assets, còn lại lấy public disk url.
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
