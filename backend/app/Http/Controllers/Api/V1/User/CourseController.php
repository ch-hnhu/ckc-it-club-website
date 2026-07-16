<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\CourseAudience;
use App\Enums\CourseStatus;
use App\Enums\LessonSectionType;
use App\Enums\TagModelType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseFollower;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonQrTicket;
use App\Models\PointRule;
use App\Models\PointTransaction;
use App\Models\Tag;
use App\Models\CourseCertificate;
use App\Services\CourseCompletionService;
use App\Services\CourseEnrollmentService;
use App\Services\PointService;
use App\Traits\HasSequentialLessonLock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends BaseApiController
{
    use HasSequentialLessonLock;
    /**
     * Danh sách khoá học đã xuất bản (catalog). Trả về shape `Course[]`.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 9), 50);
        $search = $request->query('search');
        $category = $request->query('category');
        $audience = $request->query('audience');
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
            ->when(
                $audience && in_array($audience, CourseAudience::values(), true),
                fn ($q) => $q->where('audience', $audience)
            )
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
            ->with(['quiz' => fn ($q) => $q->where('is_published', true)])
            ->get();

        // Aggregate mà transformCourseCard cần (show() không đi qua withCount/withSum của index()).
        $course->setAttribute('enrolled_count', $course->enrollments()->count());
        $course->setAttribute('total_video_seconds', (int) $lessons->sum('video_duration'));
        $course->setAttribute('followers_count', $course->followers()->count());
        $course->setAttribute('is_interested', $course->isFollowedBy($userId));

        $card = $this->transformCourseCard($course, $userId, $lessons->count());

        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $enrollment?->track);

        $data = array_merge($card, [
            'description' => $course->description ?? '',
            'enrollment_track' => $enrollment?->track,
            'enrollment_start' => $course->enrollment_start?->toIso8601String(),
            'enrollment_deadline' => $course->enrollment_deadline?->toIso8601String(),
            'course_end' => $course->course_end?->toIso8601String(),
            'max_offline_slots' => $course->max_offline_slots,
            'lessons' => $lessons->map(fn (Lesson $l) => $this->transformLessonRow($l, $userId, $enrollment?->track, $lockedIds))->all(),
            'stats' => $this->buildStats($course, $lessons, $userId, $enrollment),
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
        $lesson->load(['quiz' => fn ($q) => $q->where('is_published', true)->with('questions')]);
        app(CourseEnrollmentService::class)->assertCanLearn($course, auth('sanctum')->user());

        $userId = auth('sanctum')->id();
        $enrollment = $course->enrollmentFor($userId);

        // Chặn truy cập buổi học đang bị khoá (kể cả khi gõ URL trực tiếp).
        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $enrollment?->track);
        abort_if(
            in_array($lesson->id, $lockedIds, true),
            403,
            'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.'
        );

        $progress = $this->lessonProgressPercent($lesson, $userId, $enrollment?->track);
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
            'prev' => $prev ? [
                'slug' => $prev->slug,
                'title' => $prev->title,
                'locked' => in_array($prev->id, $lockedIds, true),
            ] : null,
            'next' => $next ? [
                'slug' => $next->slug,
                'title' => $next->title,
                'locked' => in_array($next->id, $lockedIds, true),
            ] : null,
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
                'title' => 'Tài nguyên tham khảo',
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
                'title' => 'Quiz kiểm tra buổi ' . $lesson->order,
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
        app(CourseEnrollmentService::class)->assertCanLearn($course, auth('sanctum')->user());
        $this->assertLessonContentOpen($lesson);

        $userId = auth('sanctum')->id();
        $enrollment = $course->enrollmentFor($userId);

        // Chặn xem video của buổi học đang bị khoá (kể cả khi gõ URL trực tiếp).
        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $enrollment?->track);
        abort_if(
            in_array($lesson->id, $lockedIds, true),
            403,
            'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.'
        );

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
            'enrollment_track' => $enrollment?->track,
            'course' => ['slug' => $course->slug, 'title' => $course->title],
            'lesson' => ['slug' => $lesson->slug, 'title' => $lesson->title, 'order' => $lesson->order],
            'prev_lesson' => $prev ? [
                'slug' => $prev->slug,
                'title' => $prev->title,
                'session_start' => $prev->session_start?->toIso8601String(),
                'locked' => in_array($prev->id, $lockedIds, true),
            ] : null,
            'next_lesson' => $next ? [
                'slug' => $next->slug,
                'title' => $next->title,
                'session_start' => $next->session_start?->toIso8601String(),
                'locked' => in_array($next->id, $lockedIds, true),
            ] : null,
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
        $validated = $request->validate([
            'track' => ['required', 'in:offline,online'],
        ]);

        $enrollment = app(CourseEnrollmentService::class)
            ->enroll($course, $request->user(), $validated['track']);

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

        app(CourseEnrollmentService::class)->assertCanLearn($course, $request->user());

        $userId = $request->user()->id;

        // Vé QR chỉ dành cho học viên đã ghi danh lớp offline.
        $enrollment = $course->enrollmentFor($userId);
        abort_if(
            ! $enrollment || $enrollment->track !== 'offline',
            422,
            'Chỉ học viên đã ghi danh lớp offline mới có thể đăng ký tham gia buổi học.'
        );

        // Khoá đã kết thúc thì không cấp vé nữa, kể cả buổi không set session_end.
        abort_if(
            $course->course_end && now()->gt($course->course_end),
            422,
            'Khoá học đã kết thúc, không thể đăng ký tham gia.'
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

    /**
     * Ghi nhận % xem video bài giảng (hybrid: tự động qua YouTube IFrame API + nút đánh dấu tay).
     * Chỉ học viên đã ghi danh khoá học mới được ghi tiến độ. Giữ % cao nhất đã đạt được
     * (không tụt lùi nếu xem lại từ đầu); is_completed khi đạt ngưỡng (LessonSectionType::VIDEO, 80%).
     */
    public function markVideoProgress(Request $request, Course $course, string $lessonSlug): JsonResponse
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $lessons = $course->lessons()->where('status', CourseStatus::PUBLISHED->value)->get();
        $lesson = $lessons->firstWhere('slug', $lessonSlug);
        abort_if(! $lesson, 404, 'Không tìm thấy buổi học.');
        abort_if(! $lesson->playableVideoUrl(), 422, 'Buổi học này chưa có video bài giảng.');
        app(CourseEnrollmentService::class)->assertCanLearn($course, $request->user());
        $this->assertLessonContentOpen($lesson);

        $userId = $request->user()->id;

        // Chặn ghi tiến độ cho buổi học đang bị khoá. Chỉ chặn ở lesson()/video() là
        // không đủ: gọi thẳng route này vẫn đánh dấu xong được mọi buổi, qua đó mở
        // khoá cả khoá và lấy chứng chỉ mà không xem buổi nào.
        // Tính khoá trước khi ensureEnrolledOnline để request bị từ chối không tạo
        // ghi danh, và để cùng cách xác định track như lesson().
        $lockedIds = $this->lockedLessonIds($course, $lessons, $userId, $course->enrollmentFor($userId)?->track);
        abort_if(
            in_array($lesson->id, $lockedIds, true),
            403,
            'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.'
        );

        // Vào học là tự ghi danh (track online) — không cần bước ghi danh thủ công.
        $enrollment = app(CourseEnrollmentService::class)->ensureEnrolledOnline($course, $request->user());

        $validated = $request->validate([
            'watch_percentage' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $existing = LessonProgress::where('user_id', $userId)
            ->where('lesson_id', $lesson->id)
            ->where('section_type', LessonSectionType::VIDEO->value)
            ->first();

        $bestPercentage = max((int) $validated['watch_percentage'], (int) ($existing?->watch_percentage ?? 0));
        $isCompleted = $bestPercentage >= LessonSectionType::VIDEO->videoWatchThreshold();
        $wasCompleted = (bool) ($existing?->is_completed);

        $progress = LessonProgress::updateOrCreate(
            [
                'user_id' => $userId,
                'lesson_id' => $lesson->id,
                'section_type' => LessonSectionType::VIDEO->value,
            ],
            [
                'watch_percentage' => $bestPercentage,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? ($existing?->completed_at ?? now()) : null,
            ],
        );

        if (! $wasCompleted && $isCompleted) {
            PointService::award($request->user(), 'learning_center.video_completed', $progress);
        }

        app(CourseCompletionService::class)->recalc($enrollment);

        return $this->successResponse(
            true,
            ['watch_percentage' => $progress->watch_percentage, 'is_completed' => $progress->is_completed],
            'Đã ghi nhận tiến độ xem video.',
        );
    }

    /**
     * Chứng chỉ khoá học của user hiện tại. 404 nếu chưa hoàn thành/chưa được cấp,
     * hoặc đã bị thu hồi.
     */
    public function certificate(Request $request, Course $course): JsonResponse
    {
        $enrollment = $course->enrollmentFor($request->user()->id);
        abort_if(! $enrollment, 404, 'Bạn chưa ghi danh khoá học này.');

        $certificate = CourseCertificate::where([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'track' => $enrollment->track,
        ])->whereNull('revoked_at')->first();

        abort_if(! $certificate, 404, 'Bạn chưa có chứng chỉ cho khoá học này.');

        return $this->successResponse(
            true,
            [
                'cert_code' => $certificate->cert_code,
                'cert_url' => $certificate->cert_url,
                'issued_at' => $certificate->issued_at?->toIso8601String(),
            ],
            'Lấy chứng chỉ thành công.',
        );
    }

    /**
     * Danh sách chứng chỉ (còn hiệu lực) của user hiện tại, kèm thông tin khoá học.
     * Sắp xếp mới cấp trước.
     */
    public function certificates(Request $request): JsonResponse
    {
        $certificates = CourseCertificate::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('revoked_at')
            ->with(['course:id,slug,title,thumbnail'])
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn (CourseCertificate $cert) => [
                'cert_code' => $cert->cert_code,
                'cert_url' => $cert->cert_url,
                'track' => $cert->track,
                'has_physical' => (bool) $cert->has_physical,
                'issued_at' => $cert->issued_at?->toIso8601String(),
                'course' => $cert->course ? [
                    'slug' => $cert->course->slug,
                    'title' => $cert->course->title,
                    'thumbnail' => $this->resolveUrl($cert->course->thumbnail),
                ] : null,
            ])
            ->all();

        return $this->successResponse(true, $certificates, 'Lấy danh sách chứng chỉ thành công.');
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
            'audience' => $course->audience->value,
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
     *
     * @param array<int,int> $lockedIds  lesson IDs blocked by sequential lock
     */
    private function transformLessonRow(Lesson $lesson, ?int $userId, ?string $track, array $lockedIds = []): array
    {
        $sections = $this->sectionCompletionMap($lesson, $userId);
        $isCompleted = $this->lessonProgressPercent($lesson, $userId, $track) === 100;

        $qrTicket = null;
        $isAttended = false;
        if ($userId && $track === 'offline') {
            $ticket = $lesson->qrTickets()->where('user_id', $userId)->first();
            $qrTicket = $ticket
                ? ['token' => $ticket->token, 'used_at' => $ticket->used_at?->toIso8601String()]
                : null;
            $isAttended = $lesson->attendances()->where('user_id', $userId)->exists();
        }

        // session_start > now → content (video/quiz) blocked by assertLessonContentOpen().
        $isContentAvailable = ! ($lesson->session_start && now()->lt($lesson->session_start));

        return [
            'id' => $lesson->id,
            'slug' => $lesson->slug,
            'order' => $lesson->order,
            'title' => $lesson->title,
            'summary' => $lesson->description,
            'club_only' => false,
            'is_locked' => in_array($lesson->id, $lockedIds, true),
            'is_content_available' => $isContentAvailable,
            'completed' => $isCompleted,
            'items_count' => $lesson->itemsCount(),
            'session_start' => $lesson->session_start?->toIso8601String(),
            'session_end' => $lesson->session_end?->toIso8601String(),
            'qr_ticket' => $qrTicket,
            'is_attended' => $isAttended,
        ];
    }

    private function assertLessonContentOpen(Lesson $lesson): void
    {
        if ($lesson->session_start && now()->lt($lesson->session_start)) {
            abort(403, 'Buổi học chưa bắt đầu. Vui lòng quay lại vào ngày ' . $lesson->session_start->format('d/m/Y') . '.');
        }
    }

    /**
     * Thống kê tiến độ hiển thị ở sidebar trang tổng quan.
     */
    private function buildStats(Course $course, $lessons, ?int $userId, ?CourseEnrollment $enrollment): array
    {
        $attendanceTotal = $lessons->count();
        $videoLessons = $lessons->filter(fn (Lesson $l) => (bool) $l->playableVideoUrl());
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

        $xpRules = PointRule::whereIn('key', [
            'learning_center.video_completed',
            'learning_center.quiz_passed',
            'learning_center.assignment_completed',
            'learning_center.course_completed',
        ])->pluck('points', 'key');

        $xpTotal = $videoLessons->count() * (int) ($xpRules['learning_center.video_completed'] ?? 0)
            + $quizLessons->count() * (int) ($xpRules['learning_center.quiz_passed'] ?? 0)
            + $exerciseLessons->count() * (int) ($xpRules['learning_center.assignment_completed'] ?? 0)
            + (int) ($xpRules['learning_center.course_completed'] ?? 0);

        $xpEarned = $userId
            ? $this->xpEarnedForCourse($lessons, $userId, $enrollment)
            : 0;

        return [
            'attendance_done' => $attendanceDone,
            'attendance_total' => $attendanceTotal,
            'exercises_done' => $exercisesDone,
            'exercises_total' => $exerciseLessons->count(),
            'projects_done' => 0,   // TODO(G2): chưa có schema project
            'projects_total' => 0,
            'quizzes_done' => $quizzesDone,
            'quizzes_total' => $quizLessons->count(),
            'xp_earned' => $xpEarned,
            'xp_total' => $xpTotal,
            'badges_earned' => 0,
            'badges_total' => 0,
        ];
    }

    /**
     * Tổng điểm XP đã cộng thật (point_transactions) cho user trong khoá học này — gồm
     * điểm từng buổi (video/quiz/bài tập) và điểm thưởng hoàn thành khoá (nếu đã đạt).
     */
    private function xpEarnedForCourse($lessons, int $userId, ?CourseEnrollment $enrollment): int
    {
        $progressIds = LessonProgress::where('user_id', $userId)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->pluck('id');

        $lessonXp = $progressIds->isNotEmpty()
            ? (int) PointTransaction::where('user_id', $userId)
                ->where('source_type', 'lesson_progress')
                ->whereIn('source_id', $progressIds)
                ->whereHas('pointRule', fn ($q) => $q->whereIn('key', [
                    'learning_center.video_completed',
                    'learning_center.quiz_passed',
                    'learning_center.assignment_completed',
                ]))
                ->sum('points')
            : 0;

        $courseXp = $enrollment
            ? (int) PointTransaction::where('user_id', $userId)
                ->where('source_type', 'course_enrollment')
                ->where('source_id', $enrollment->id)
                ->whereHas('pointRule', fn ($q) => $q->where('key', 'learning_center.course_completed'))
                ->sum('points')
            : 0;

        return $lessonXp + $courseXp;
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
        // DB now stores the full public URL (Supabase https://... or external).
        return $path ?: null;
    }
}
