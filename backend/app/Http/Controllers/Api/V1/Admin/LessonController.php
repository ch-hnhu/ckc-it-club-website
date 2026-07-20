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
use App\Models\User;
use App\Services\CourseCompletionService;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class LessonController extends BaseApiController
{
    #[OA\Get(
        path: '/v1/courses/{course}/lessons/{lesson}',
        summary: '[Admin] Chi tiết một buổi học (đầy đủ field, để prefill form sửa)',
        description: 'Yêu cầu quyền courses.view.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
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
    #[OA\Post(
        path: '/v1/courses/{course}/lessons',
        summary: '[Admin] Tạo buổi học mới trong khoá (order tự động = max(order)+1)',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['title'], properties: [
                new OA\Property(property: 'title', type: 'string', maxLength: 255),
                new OA\Property(property: 'description', type: 'string', maxLength: 5000, nullable: true),
                new OA\Property(property: 'status', type: 'string', enum: ['draft', 'published'], nullable: true),
                new OA\Property(property: 'session_start', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'session_end', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'resource_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'video_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'video_duration', type: 'integer', nullable: true, description: 'Giây'),
                new OA\Property(property: 'live_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'live_duration', type: 'integer', nullable: true, description: 'Giây'),
                new OA\Property(property: 'document', type: 'string', nullable: true, description: 'Nội dung markdown'),
                new OA\Property(property: 'assignment_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'assignment_deadline', type: 'string', format: 'date-time', nullable: true),
            ])
        ),
        responses: [
            new OA\Response(response: 201, description: 'Tạo thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
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
    #[OA\Put(
        path: '/v1/courses/{course}/lessons/{lesson}',
        summary: '[Admin] Cập nhật buổi học',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(properties: [
                new OA\Property(property: 'title', type: 'string', maxLength: 255, nullable: true),
                new OA\Property(property: 'description', type: 'string', maxLength: 5000, nullable: true),
                new OA\Property(property: 'status', type: 'string', enum: ['draft', 'published'], nullable: true),
                new OA\Property(property: 'session_start', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'session_end', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'resource_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'video_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'video_duration', type: 'integer', nullable: true),
                new OA\Property(property: 'live_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'live_duration', type: 'integer', nullable: true),
                new OA\Property(property: 'document', type: 'string', nullable: true),
                new OA\Property(property: 'assignment_url', type: 'string', format: 'uri', nullable: true),
                new OA\Property(property: 'assignment_deadline', type: 'string', format: 'date-time', nullable: true),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Cập nhật thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
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
    #[OA\Delete(
        path: '/v1/courses/{course}/lessons/{lesson}',
        summary: '[Admin] Xoá mềm buổi học',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Đã xóa', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
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
    #[OA\Post(
        path: '/v1/courses/{course}/lessons/{lesson}/check-in',
        summary: '[Admin] Điểm danh buổi học bằng mã QR (token trên vé của học viên)',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['qr_token'], properties: [
                new OA\Property(property: 'qr_token', type: 'string'),
            ])
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Điểm danh thành công (hoặc đã điểm danh trước đó)',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'already', type: 'boolean'),
                        new OA\Property(property: 'student', ref: '#/components/schemas/User'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Mã QR không hợp lệ cho buổi học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
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
     * Điểm danh thủ công một học viên cho buổi học (dùng khi máy quét QR lỗi) — toggle
     * trạng thái có mặt/vắng trực tiếp từ ma trận điểm danh. present=true → tạo bản ghi
     * điểm danh thủ công; present=false → gỡ bỏ. Tính lại tiến độ hoàn thành khoá sau đó.
     */
    #[OA\Post(
        path: '/v1/courses/{course}/lessons/{lesson}/attendance',
        summary: '[Admin] Điểm danh thủ công một học viên (toggle có mặt/vắng)',
        description: 'Yêu cầu quyền courses.manage. Dùng khi máy quét QR lỗi. Chỉ áp dụng cho học viên track offline.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['user_id', 'present'], properties: [
                new OA\Property(property: 'user_id', type: 'integer'),
                new OA\Property(property: 'present', type: 'boolean'),
                new OA\Property(property: 'note', type: 'string', maxLength: 500, nullable: true),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Không phải buổi offline đã xếp lịch, hoặc học viên không thuộc lớp offline', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function toggleAttendance(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        abort_if(! $lesson->session_start, 422, 'Chỉ điểm danh cho buổi học offline đã xếp lịch.');

        $data = $request->validate([
            'user_id' => 'required|integer',
            'present' => 'required|boolean',
            'note'    => 'nullable|string|max:500',
        ]);

        $enrollment = $course->enrollmentFor($data['user_id']);
        abort_if(! $enrollment || $enrollment->track !== 'offline', 422, 'Học viên không thuộc lớp offline của khóa này.');

        if ($data['present']) {
            LessonAttendance::firstOrCreate(
                ['user_id' => $data['user_id'], 'lesson_id' => $lesson->id],
                ['type' => 'manual', 'note' => $data['note'] ?? null, 'attended_at' => now(), 'recorded_by' => $request->user()->id],
            );
        } else {
            LessonAttendance::where(['user_id' => $data['user_id'], 'lesson_id' => $lesson->id])->delete();
        }

        app(CourseCompletionService::class)->recalc($enrollment);

        return $this->successResponse(true, [
            'user_id' => (int) $data['user_id'],
            'lesson_id' => $lesson->id,
            'present' => (bool) $data['present'],
        ], $data['present'] ? 'Đã điểm danh.' : 'Đã bỏ điểm danh.');
    }

    /**
     * Danh sách học viên track offline đã ghi danh + trạng thái chấm bài tập (đạt/chưa chấm).
     * Chấm bài chỉ áp dụng cho track offline (online tính tiến độ theo % xem video).
     */
    #[OA\Get(
        path: '/v1/courses/{course}/lessons/{lesson}/grades',
        summary: '[Admin] Danh sách học viên offline + trạng thái chấm bài tập của buổi học',
        description: 'Yêu cầu quyền courses.manage. Chấm bài chỉ áp dụng cho track offline.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function grades(Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $passedMap = LessonProgress::query()
            ->where('lesson_id', $lesson->id)
            ->where('section_type', LessonSectionType::ASSIGNMENT)
            ->pluck('is_completed', 'user_id');

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
                // null = chưa chấm, true = đạt, false = không đạt
                'passed' => array_key_exists($e->user_id, $passedMap->all())
                    ? (bool) $passedMap[$e->user_id]
                    : null,
            ])
            ->all();

        return $this->successResponse(true, $students, ApiMessage::RETRIEVED);
    }

    /**
     * Lưu kết quả chấm bài tập (đạt/không đạt) cho nhiều học viên track offline.
     * passed = null → xoá bản ghi (chưa chấm); passed = true/false → ghi is_completed trực tiếp.
     */
    #[OA\Put(
        path: '/v1/courses/{course}/lessons/{lesson}/grades',
        summary: '[Admin] Lưu kết quả chấm bài tập (đạt/không đạt/chưa chấm) cho nhiều học viên offline',
        description: 'Yêu cầu quyền courses.manage. passed=null xoá bản ghi (chưa chấm).',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'course', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['grades'], properties: [
                new OA\Property(
                    property: 'grades',
                    type: 'array',
                    items: new OA\Items(properties: [
                        new OA\Property(property: 'user_id', type: 'integer'),
                        new OA\Property(property: 'passed', type: 'boolean', nullable: true),
                    ])
                ),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Thành công (trả về danh sách grades mới nhất, giống GET grades)', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Buổi học không thuộc khoá học này', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate / học viên không thuộc track offline', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function saveGrades(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->assertBelongsTo($course, $lesson);

        $data = $request->validate([
            'grades' => 'required|array',
            'grades.*.user_id' => 'required|integer',
            'grades.*.passed' => 'nullable|boolean',
        ]);

        $offlineUserIds = $course->enrollments()->where('track', 'offline')->pluck('user_id')->all();
        $newlyCompleted = [];

        DB::transaction(function () use ($data, $lesson, $offlineUserIds, &$newlyCompleted) {
            foreach ($data['grades'] as $grade) {
                abort_if(
                    ! in_array($grade['user_id'], $offlineUserIds, true),
                    422,
                    'Chỉ chấm bài tập cho học viên track offline.'
                );

                if ($grade['passed'] === null) {
                    LessonProgress::where([
                        'user_id' => $grade['user_id'],
                        'lesson_id' => $lesson->id,
                        'section_type' => LessonSectionType::ASSIGNMENT,
                    ])->delete();

                    continue;
                }

                $existing = LessonProgress::where([
                    'user_id' => $grade['user_id'],
                    'lesson_id' => $lesson->id,
                    'section_type' => LessonSectionType::ASSIGNMENT,
                ])->first();

                $isPassed = (bool) $grade['passed'];

                $progress = LessonProgress::updateOrCreate(
                    [
                        'user_id' => $grade['user_id'],
                        'lesson_id' => $lesson->id,
                        'section_type' => LessonSectionType::ASSIGNMENT,
                    ],
                    [
                        'score' => null,
                        'is_completed' => $isPassed,
                        'completed_at' => $isPassed ? now() : null,
                    ],
                );

                if (! ((bool) $existing?->is_completed) && $isPassed) {
                    $newlyCompleted[] = $progress;
                }
            }
        });

        if ($newlyCompleted !== []) {
            $usersById = User::whereIn('id', array_map(fn ($p) => $p->user_id, $newlyCompleted))
                ->get()
                ->keyBy('id');
            foreach ($newlyCompleted as $progress) {
                if ($user = $usersById->get($progress->user_id)) {
                    PointService::award($user, 'learning_center.assignment_completed', $progress);
                }
            }
        }

        $affectedUserIds = collect($data['grades'])->pluck('user_id')->unique();
        $completionService = app(CourseCompletionService::class);
        $course->enrollments()
            ->whereIn('user_id', $affectedUserIds)
            ->get()
            ->each(fn ($enrollment) => $completionService->recalc($enrollment));

        return $this->grades($course, $lesson);
    }

    /**
     * Lấy thời lượng video YouTube từ URL qua YouTube Data API v3 (contentDetails.duration).
     * Trả về số giây + nhãn "X tiếng Y phút" để admin form tự điền (không nhập tay).
     */
    #[OA\Get(
        path: '/v1/lessons/youtube-duration',
        summary: '[Admin] Lấy thời lượng video YouTube từ URL (qua YouTube Data API v3)',
        description: 'Yêu cầu quyền courses.manage. Dùng để form admin tự điền thời lượng, không cần nhập tay.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'url', in: 'query', required: true, schema: new OA\Schema(type: 'string', maxLength: 2048)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'seconds', type: 'integer'),
                        new OA\Property(property: 'label', type: 'string', example: '1 tiếng 20 phút'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 422, description: 'Link không hợp lệ / chưa cấu hình API key / lỗi gọi YouTube API', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function youtubeDuration(Request $request): JsonResponse
    {
        $data = $request->validate([
            'url' => 'required|string|max:2048',
        ]);

        $videoId = $this->parseYoutubeId($data['url']);
        abort_if(! $videoId, 422, 'Link YouTube không hợp lệ.');

        $apiKey = config('services.youtube.key');
        abort_if(! $apiKey, 422, 'Chưa cấu hình YOUTUBE_API_KEY trên máy chủ.');

        // Máy dev Windows thường thiếu CA bundle → tắt verify SSL khi chạy local
        // (giống OAuth). Production vẫn verify bình thường.
        $verifySsl = filter_var(env('OAUTH_HTTP_VERIFY', ! app()->environment('local')), FILTER_VALIDATE_BOOL);

        $response = Http::withOptions(['verify' => $verifySsl])
            ->get('https://www.googleapis.com/youtube/v3/videos', [
                'part' => 'contentDetails',
                'id' => $videoId,
                'key' => $apiKey,
            ]);

        abort_if($response->failed(), 422, 'Không gọi được YouTube API. Kiểm tra lại API key.');

        $isoDuration = $response->json('items.0.contentDetails.duration');
        abort_if(! $isoDuration, 422, 'Không tìm thấy video hoặc video không công khai.');

        $seconds = $this->iso8601ToSeconds($isoDuration);

        return $this->successResponse(true, [
            'seconds' => $seconds,
            'label' => $this->durationLabel($seconds),
        ], ApiMessage::RETRIEVED);
    }

    /**
     * Tách video ID từ các dạng URL YouTube: watch?v=, youtu.be/, embed/, shorts/.
     */
    private function parseYoutubeId(string $url): ?string
    {
        $patterns = [
            '#youtu\.be/([A-Za-z0-9_-]{11})#',
            '#youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|v/)([A-Za-z0-9_-]{11})#',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $m)) {
                return $m[1];
            }
        }

        // URL chỉ chứa đúng ID (11 ký tự)
        return preg_match('#^[A-Za-z0-9_-]{11}$#', trim($url)) ? trim($url) : null;
    }

    /**
     * ISO8601 duration (PT#H#M#S) → tổng số giây.
     */
    private function iso8601ToSeconds(string $iso): int
    {
        try {
            $interval = new \DateInterval($iso);
        } catch (\Exception) {
            return 0;
        }

        return ($interval->d * 86400)
            + ($interval->h * 3600)
            + ($interval->i * 60)
            + $interval->s;
    }

    /**
     * Nhãn thời lượng dạng "X tiếng Y phút" (bỏ qua phần 0, làm tròn phút lên).
     */
    private function durationLabel(int $seconds): string
    {
        if ($seconds <= 0) {
            return '—';
        }

        $hours = intdiv($seconds, 3600);
        $minutes = (int) round(($seconds % 3600) / 60);

        if ($minutes === 60) {
            $hours++;
            $minutes = 0;
        }

        $parts = [];
        if ($hours > 0) {
            $parts[] = "{$hours} tiếng";
        }
        if ($minutes > 0 || $hours === 0) {
            $parts[] = "{$minutes} phút";
        }

        return implode(' ', $parts);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function assertBelongsTo(Course $course, Lesson $lesson): void
    {
        abort_if($lesson->course_id !== $course->id, 404, 'Buổi học không thuộc khóa học này.');
    }

    private function resolveAvatar(?string $avatar): ?string
    {
        // DB now stores the full public URL (Supabase https://... or external).
        return $avatar ?: null;
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
            'video_url' => 'nullable|url|max:2048',
            'video_duration' => 'nullable|integer|min:0|max:86400',
            'live_url' => 'nullable|url|max:2048',
            'live_duration' => 'nullable|integer|min:0|max:86400',
            'document' => 'nullable|string',
            'assignment_url' => 'nullable|url|max:2048',
            'assignment_deadline' => 'nullable|date',
        ]);
    }

    private function nullifyEmpty(Request $request): void
    {
        $fields = [
            'description', 'session_start', 'session_end', 'resource_url',
            'video_url', 'video_duration', 'live_url', 'live_duration', 'document', 'assignment_url', 'assignment_deadline',
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
            'video_url' => $lesson->video_url,
            'video_duration' => $lesson->video_duration,
            'live_url' => $lesson->live_url,
            'live_duration' => $lesson->live_duration,
            'document' => $lesson->document,
            'assignment_url' => $lesson->assignment_url,
            'assignment_deadline' => $lesson->assignment_deadline?->toIso8601String(),
        ];
    }
}
