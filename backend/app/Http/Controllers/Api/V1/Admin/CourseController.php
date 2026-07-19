<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\CourseAudience;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\LessonQrTicket;
use App\Models\Tag;
use App\Models\User;
use App\Services\CourseCertificateService;
use App\Services\CourseEnrollmentService;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use ZipArchive;

class CourseController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}
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
        $audience = $request->query('audience');
        $offline = $request->query('offline'); // all | has_offline | online_only

        $sortable = [
            'id', 'title', 'level', 'status', 'audience', 'max_offline_slots',
            'lessons_count', 'enrollments_count', 'enrollment_deadline', 'created_at', 'creator',
        ];
        $sort = in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'created_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $courses = Course::query()
            ->with(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
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
            ->when($audience && $audience !== 'all', fn ($q) => $q->where('audience', $audience))
            ->when($offline === 'has_offline', fn ($q) => $q->whereNotNull('max_offline_slots'))
            ->when($offline === 'online_only', fn ($q) => $q->whereNull('max_offline_slots'))
            ->when(
                $sort === 'creator',
                fn ($q) => $q->orderBy(
                    User::select('full_name')->whereColumn('users.id', 'courses.created_by'),
                    $order,
                ),
                fn ($q) => $q->orderBy($sort, $order),
            )
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
            'audience' => 'nullable|in:' . implode(',', CourseAudience::values()),
            'enrollment_start' => 'nullable|date',
            'enrollment_deadline' => 'nullable|date|after_or_equal:enrollment_start',
            'course_end' => 'nullable|date|after_or_equal:enrollment_deadline',
            'max_offline_slots' => 'nullable|integer|min:1|max:1000',
            'max_absent_allowed' => 'nullable|integer|min:0|max:50',
            'quiz_pass_threshold' => 'nullable|integer|min:0|max:100',
            'certificate_template_id' => 'nullable|integer|exists:certificate_templates,id',
            'thumbnail' => 'nullable|image|max:5120',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
            'mentor_ids' => 'nullable|array',
            'mentor_ids.*' => 'integer|exists:users,id',
        ]);

        // Không mở lớp offline → khoá chỉ online; xoá luôn các trường liên quan
        if ($request->has('has_offline') && ! $request->boolean('has_offline')) {
            $data['max_offline_slots']    = null;
            $data['max_absent_allowed']   = null;
            $data['enrollment_start']     = null;
            $data['enrollment_deadline']  = null;
            $data['course_end']           = null;
        } elseif ($data['max_offline_slots'] !== null) {
            // Offline course bắt buộc phải có max_absent_allowed
            if (! isset($data['max_absent_allowed']) || $data['max_absent_allowed'] === null) {
                $data['max_absent_allowed'] = 3;
            }
        }

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $this->storage->uploadImage($request->file('thumbnail'), 'course');
        }

        $course = DB::transaction(function () use ($data, $thumbnailPath, $request) {
            $course = Course::create([
                'title' => $data['title'],
                'slug' => $this->generateUniqueSlug($data['title']),
                'description' => $data['description'] ?? null,
                'thumbnail' => $thumbnailPath,
                'level' => $data['level'],
                'status' => $data['status'] ?? 'draft',
                'audience' => $data['audience'] ?? CourseAudience::CAO_THANG_STUDENT->value,
                'enrollment_start' => $data['enrollment_start'] ?? null,
                'enrollment_deadline' => $data['enrollment_deadline'] ?? null,
                'course_end' => $data['course_end'] ?? null,
                'max_offline_slots' => $data['max_offline_slots'] ?? null,
                'max_absent_allowed' => $data['max_absent_allowed'] ?? 1,
                'quiz_pass_threshold' => $data['quiz_pass_threshold'] ?? 80,
                'certificate_template_id' => $data['certificate_template_id'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            if (! empty($data['tag_ids'])) {
                $course->tags()->sync($data['tag_ids']);
            }

            if (! empty($data['mentor_ids'])) {
                $course->mentors()->sync($data['mentor_ids']);
            }

            return $course;
        });

        $course->load(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
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
            'audience' => 'sometimes|required|in:' . implode(',', CourseAudience::values()),
            'enrollment_start' => 'nullable|date',
            'enrollment_deadline' => 'nullable|date|after_or_equal:enrollment_start',
            'course_end' => 'nullable|date|after_or_equal:enrollment_deadline',
            'max_offline_slots' => 'nullable|integer|min:1|max:1000',
            'max_absent_allowed' => 'nullable|integer|min:0|max:50',
            'quiz_pass_threshold' => 'nullable|integer|min:0|max:100',
            'certificate_template_id' => 'nullable|integer|exists:certificate_templates,id',
            'thumbnail' => 'nullable|image|max:5120',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:tags,id',
            'mentor_ids' => 'nullable|array',
            'mentor_ids.*' => 'integer|exists:users,id',
        ]);

        // Thumbnail: thay mới / gỡ bỏ / giữ nguyên
        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail) {
                $this->storage->delete($course->thumbnail);
            }
            $data['thumbnail'] = $this->storage->uploadImage($request->file('thumbnail'), 'course');
        } elseif ($request->boolean('remove_thumbnail')) {
            if ($course->thumbnail) {
                $this->storage->delete($course->thumbnail);
            }
            $data['thumbnail'] = null;
        } else {
            unset($data['thumbnail']);
        }

        // Không mở lớp offline → khoá chỉ online; xoá luôn các trường liên quan
        if ($request->has('has_offline') && ! $request->boolean('has_offline')) {
            $data['max_offline_slots']    = null;
            $data['max_absent_allowed']   = null;
            $data['enrollment_start']     = null;
            $data['enrollment_deadline']  = null;
            $data['course_end']           = null;
        } else {
            // Nếu set max_offline_slots, bắt buộc phải có max_absent_allowed
            $maxOfflineSlots = $data['max_offline_slots'] ?? $course->max_offline_slots;
            if ($maxOfflineSlots !== null) {
                if (! isset($data['max_absent_allowed']) || $data['max_absent_allowed'] === null) {
                    $data['max_absent_allowed'] = $course->max_absent_allowed ?? 3;
                }
            }
        }

        $tagIds = $data['tag_ids'] ?? null;
        unset($data['tag_ids']);

        $mentorIds = $data['mentor_ids'] ?? null;
        unset($data['mentor_ids']);

        DB::transaction(function () use ($course, $data, $tagIds, $mentorIds, $request) {
            $course->update([...$data, 'updated_by' => $request->user()->id]);

            if ($request->has('tag_ids') || $tagIds !== null) {
                $course->tags()->sync($tagIds ?? []);
            }

            if ($request->has('mentor_ids') || $mentorIds !== null) {
                $course->mentors()->sync($mentorIds ?? []);
            }
        });

        $course->refresh()
            ->load(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
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

        $sortable = ['id', 'title', 'level', 'enrollments_count', 'deleted_at'];
        $sort = in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'deleted_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $courses = Course::onlyTrashed()
            ->with(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
            ->withCount($this->courseCounts())
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy($sort, $order)
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

        $course->load(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
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
            $this->storage->delete($course->thumbnail);
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
        $course->load(['creator:id,full_name,avatar', 'tags:id,name', 'mentors:id,full_name,avatar', 'certificateTemplate:id,name'])
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

        [$attendedByUser, $pastOfflineCount] = $this->absentContext($lessons);

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
            'enrollments' => $enrollments->map(
                fn (CourseEnrollment $e) => $this->transformEnrollment($e, $attendedByUser, $pastOfflineCount)
            )->all(),
            'certificates' => $certificates->map(fn (CourseCertificate $cert) => $this->transformCertificate($cert))->all(),
            // Các cặp (học viên, buổi) đã điểm danh — dùng dựng ma trận điểm danh ở tab "Điểm danh".
            'attendances' => $this->attendanceMatrix($lessons),
            // Các cặp (học viên, buổi) đã đăng ký "sẽ tham gia" (vé QR) — dùng hiển thị danh sách dự kiến.
            'registrations' => $this->registrationMatrix($lessons),
        ]);

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    /**
     * Thu hồi chứng chỉ — giữ lại bản ghi + file PDF cũ làm lịch sử, chỉ đánh dấu đã thu hồi.
     */
    public function revokeCertificate(Request $request, Course $course, CourseCertificate $certificate): JsonResponse
    {
        $this->assertCertificateBelongsTo($course, $certificate);
        abort_if((bool) $certificate->revoked_at, 422, 'Chứng chỉ này đã bị thu hồi trước đó.');

        app(CourseCertificateService::class)->revoke($certificate, $request->user());

        return $this->successResponse(true, $this->transformCertificate($certificate->refresh()), 'Đã thu hồi chứng chỉ.');
    }

    /**
     * Cấp lại chứng chỉ (sinh cert_code + PDF mới, gỡ trạng thái thu hồi nếu có).
     */
    public function reissueCertificate(Course $course, CourseCertificate $certificate): JsonResponse
    {
        $this->assertCertificateBelongsTo($course, $certificate);

        $certificate = app(CourseCertificateService::class)->reissue($certificate);

        return $this->successResponse(true, $this->transformCertificate($certificate), 'Đã cấp lại chứng chỉ.');
    }

    /**
     * Gom toàn bộ chứng chỉ bản in (has_physical=true, còn hiệu lực) của khoá học vào
     * một file ZIP để gửi in hàng loạt. Cert đã thu hồi bị loại trừ. Mỗi PDF trong ZIP
     * được đặt tên theo học viên + mã chứng chỉ để dễ tra cứu khi in.
     */
    public function exportPhysicalCertificates(Course $course): BinaryFileResponse|JsonResponse
    {
        $certificates = $course->certificates()
            ->with('user:id,full_name')
            ->where('has_physical', true)
            ->whereNull('revoked_at')
            ->whereNotNull('cert_url')
            ->orderBy('cert_code')
            ->get();

        abort_if($certificates->isEmpty(), 422, 'Khoá học chưa có chứng chỉ bản in nào để xuất.');
        abort_if(! class_exists(ZipArchive::class), 500, 'Máy chủ chưa bật ZipArchive để nén file.');

        $tmpPath = tempnam(sys_get_temp_dir(), 'certs_');

        $zip = new ZipArchive();
        abort_if($zip->open($tmpPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true, 500, 'Không tạo được file ZIP.');

        $usedNames = [];
        $added = 0;
        foreach ($certificates as $cert) {
            if (! $cert->cert_url) {
                continue;
            }
            $verifySsl = filter_var(env('HTTP_VERIFY_SSL', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
            $response = Http::withOptions(['verify' => $verifySsl])->timeout(30)->get($cert->cert_url);
            if (! $response->successful()) {
                continue;
            }
            $zip->addFromString($this->certificateFileName($cert, $usedNames), $response->body());
            $added++;
        }
        $zip->close();

        if ($added === 0) {
            @unlink($tmpPath);
            abort(422, 'Không tìm thấy file PDF nào của các chứng chỉ bản in.');
        }

        return response()
            ->download($tmpPath, 'chung-chi-ban-in-'.$course->slug.'.zip', ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend(true);
    }

    /**
     * Gộp toàn bộ chứng chỉ bản in (has_physical=true, còn hiệu lực) của khoá học thành
     * MỘT file PDF nhiều trang, trả về inline để trình duyệt mở hộp thoại in như bình thường
     * (mỗi chứng chỉ là một trang). Cert đã thu hồi bị loại trừ.
     */
    public function printPhysicalCertificates(Course $course): Response|JsonResponse
    {
        $certificates = $course->certificates()
            ->where('has_physical', true)
            ->whereNull('revoked_at')
            ->whereNotNull('cert_url')
            ->orderBy('cert_code')
            ->get();

        abort_if($certificates->isEmpty(), 422, 'Khoá học chưa có chứng chỉ bản in nào để in.');

        $pdf = new Fpdi();
        $added = 0;
        foreach ($certificates as $cert) {
            if (! $cert->cert_url) {
                continue;
            }
            $verifySsl = filter_var(env('HTTP_VERIFY_SSL', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
            $pdfResponse = Http::withOptions(['verify' => $verifySsl])->timeout(30)->get($cert->cert_url);
            if (! $pdfResponse->successful()) {
                continue;
            }
            // Write PDF bytes to a temp file so FPDI can read it.
            $tmpPdf = tempnam(sys_get_temp_dir(), 'cert_pdf_');
            file_put_contents($tmpPdf, $pdfResponse->body());
            try {
                $pageCount = $pdf->setSourceFile($tmpPdf);
                for ($n = 1; $n <= $pageCount; $n++) {
                    $tpl = $pdf->importPage($n);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                    $added++;
                }
            } catch (\Throwable $e) {
                // Bỏ qua file PDF không đọc được (hỏng/định dạng lạ), vẫn gộp các file còn lại.
            } finally {
                @unlink($tmpPdf);
            }
        }

        abort_if($added === 0, 422, 'Không tìm thấy file PDF nào của các chứng chỉ bản in.');

        return response($pdf->Output('S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="chung-chi-ban-in-'.$course->slug.'.pdf"',
        ]);
    }

    /**
     * Danh sách user để chọn làm mentor khoá học (dùng cho multiselect ở form thêm/sửa).
     */
    public function mentorOptions(): JsonResponse
    {
        $users = User::query()
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'avatar']);

        return $this->successResponse(true, $users->map(fn (User $u) => [
            'id' => $u->id,
            'full_name' => $u->full_name,
            'avatar' => $this->resolveUrl($u->avatar),
        ])->all(), ApiMessage::RETRIEVED);
    }

    /**
     * Tìm user chưa ghi danh khoá học (theo tên/email/username) để admin chọn ghi danh thay.
     */
    public function searchEnrollableUsers(Request $request, Course $course): JsonResponse
    {
        $search = trim((string) $request->query('search'));
        abort_if(mb_strlen($search) < 2, 422, 'Nhập tối thiểu 2 ký tự để tìm kiếm.');

        $enrolledIds = $course->enrollments()->pluck('user_id');

        $users = User::query()
            ->whereNotIn('id', $enrolledIds)
            ->where(
                fn ($q) => $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
            )
            ->limit(10)
            ->get(['id', 'full_name', 'email', 'avatar']);

        return $this->successResponse(true, $users->map(fn (User $u) => [
            'id' => $u->id,
            'full_name' => $u->full_name,
            'email' => $u->email,
            'avatar' => $this->resolveUrl($u->avatar),
        ])->all(), ApiMessage::RETRIEVED);
    }

    /**
     * Ghi danh thay học viên (admin). Áp cùng điều kiện như học viên tự đăng ký
     * (tư cách + cửa sổ thời gian + giới hạn slot offline) — tái dùng CourseEnrollmentService.
     */
    public function enrollStudent(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'track' => 'required|in:offline,online',
        ]);

        $enrollment = app(CourseEnrollmentService::class)
            ->enroll($course, User::findOrFail($data['user_id']), $data['track']);

        $enrollment->load('user:id,full_name,email,avatar');
        [$attendedByUser, $pastOfflineCount] = $this->absentContext($course->lessons()->get());

        return $this->createdResponse(
            $this->transformEnrollment($enrollment, $attendedByUser, $pastOfflineCount),
            'Ghi danh học viên thành công.'
        );
    }

    /**
     * Xoá ghi danh (admin) — cascade xoá tiến độ/điểm danh liên quan trong khoá này.
     * Chứng chỉ đã cấp được giữ lại.
     */
    public function removeEnrollment(Course $course, CourseEnrollment $enrollment): JsonResponse
    {
        $this->assertEnrollmentBelongsTo($course, $enrollment);

        app(CourseEnrollmentService::class)->remove($enrollment);

        return $this->successResponse(true, null, 'Đã xoá ghi danh.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function assertEnrollmentBelongsTo(Course $course, CourseEnrollment $enrollment): void
    {
        abort_if($enrollment->course_id !== $course->id, 404, 'Ghi danh không thuộc khóa học này.');
    }

    private function assertCertificateBelongsTo(Course $course, CourseCertificate $certificate): void
    {
        abort_if($certificate->course_id !== $course->id, 404, 'Chứng chỉ không thuộc khóa học này.');
    }

    /**
     * Suy ra đường dẫn file từ cert_url.
     * Đối với URL Supabase, trả về chính URL đó (download trực tiếp bằng Http::get).
     * Giữ lại hàm để tương thích với các cert cũ được tạo trước khi migration.
     * @deprecated Nư cần, dùng cert_url trực tiếp.
     */
    private function storagePathFromUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $marker = '/storage/';
        $pos = strpos($url, $marker);

        return $pos !== false ? substr($url, $pos + strlen($marker)) : null;
    }

    /**
     * Tên file PDF trong ZIP: "<họ-tên>-<mã-cert>.pdf", đảm bảo không trùng.
     */
    private function certificateFileName(CourseCertificate $cert, array &$usedNames): string
    {
        $base = Str::slug(($cert->user?->full_name ?: 'hoc-vien').' '.$cert->cert_code) ?: $cert->cert_code;
        $file = $base.'.pdf';
        $i = 1;
        while (isset($usedNames[$file])) {
            $file = $base.'-'.(++$i).'.pdf';
        }
        $usedNames[$file] = true;

        return $file;
    }

    /**
     * Số buổi vắng (offline) tính trên các buổi offline đã kết thúc.
     *
     * @param  \Illuminate\Support\Collection<int,Lesson>  $lessons
     * @return array{0:array<int,int>,1:int} [attendedByUser, pastOfflineCount]
     */
    private function absentContext($lessons): array
    {
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

        return [$attendedByUser, $pastOfflineCount];
    }

    /**
     * Các bản ghi điểm danh của những buổi offline (đã xếp lịch) trong khoá —
     * mỗi phần tử là một ô đã điểm danh trong ma trận học viên × buổi.
     *
     * @param  \Illuminate\Support\Collection<int,Lesson>  $lessons
     * @return array<int,array{user_id:int,lesson_id:int,type:string}>
     */
    private function attendanceMatrix($lessons): array
    {
        $offlineLessonIds = $lessons
            ->filter(fn (Lesson $l) => $l->session_start)
            ->pluck('id');

        if ($offlineLessonIds->isEmpty()) {
            return [];
        }

        $recorderNames = collect();
        $attendances = LessonAttendance::query()
            ->whereIn('lesson_id', $offlineLessonIds)
            ->get(['user_id', 'lesson_id', 'type', 'note', 'attended_at', 'recorded_by']);

        $recorderIds = $attendances->pluck('recorded_by')->filter()->unique()->values();
        if ($recorderIds->isNotEmpty()) {
            $recorderNames = \App\Models\User::whereIn('id', $recorderIds)
                ->pluck('full_name', 'id');
        }

        return $attendances->map(fn (LessonAttendance $a) => [
            'user_id'           => $a->user_id,
            'lesson_id'         => $a->lesson_id,
            'type'              => $a->type,
            'note'              => $a->note,
            'attended_at'       => $a->attended_at?->toISOString(),
            'recorded_by_name'  => $a->recorded_by ? ($recorderNames[$a->recorded_by] ?? null) : null,
        ])->all();
    }

    /**
     * Các vé "sẽ tham gia" (lesson_qr_tickets) học viên đã đăng ký cho từng buổi offline —
     * mỗi phần tử là một đăng ký dự kiến có mặt.
     *
     * @param  \Illuminate\Support\Collection<int,Lesson>  $lessons
     * @return array<int,array{user_id:int,lesson_id:int}>
     */
    private function registrationMatrix($lessons): array
    {
        $offlineLessonIds = $lessons
            ->filter(fn (Lesson $l) => $l->session_start)
            ->pluck('id');

        if ($offlineLessonIds->isEmpty()) {
            return [];
        }

        return LessonQrTicket::query()
            ->whereIn('lesson_id', $offlineLessonIds)
            ->get(['user_id', 'lesson_id'])
            ->map(fn (LessonQrTicket $t) => [
                'user_id' => $t->user_id,
                'lesson_id' => $t->lesson_id,
            ])
            ->all();
    }

    /**
     * Map CourseEnrollment → dòng trong tab "Học viên".
     */
    private function transformEnrollment(CourseEnrollment $e, array $attendedByUser, int $pastOfflineCount): array
    {
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
    }

    /**
     * Map CourseCertificate → dòng trong tab "Chứng chỉ".
     */
    private function transformCertificate(CourseCertificate $cert): array
    {
        return [
            'id' => $cert->id,
            'cert_code' => $cert->cert_code,
            'cert_url' => $cert->cert_url,
            'user' => [
                'id' => $cert->user?->id,
                'full_name' => $cert->user?->full_name,
                'email' => $cert->user?->email,
            ],
            'track' => $cert->track,
            'has_physical' => (bool) $cert->has_physical,
            'issued_at' => $cert->issued_at?->toIso8601String(),
            'revoked_at' => $cert->revoked_at?->toIso8601String(),
        ];
    }

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
            'audience' => $course->audience->value,
            'enrollment_start' => $course->enrollment_start?->toIso8601String(),
            'enrollment_deadline' => $course->enrollment_deadline?->toIso8601String(),
            'course_end' => $course->course_end?->toIso8601String(),
            'max_offline_slots' => $course->max_offline_slots,
            'max_absent_allowed' => $course->max_absent_allowed,
            'quiz_pass_threshold' => $course->quiz_pass_threshold,
            'certificate_template' => $course->certificateTemplate ? [
                'id' => $course->certificateTemplate->id,
                'name' => $course->certificateTemplate->name,
            ] : null,
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
            'mentors' => $course->relationLoaded('mentors')
                ? $course->mentors->map(fn (User $m) => [
                    'id' => $m->id,
                    'full_name' => $m->full_name,
                    'avatar' => $this->resolveUrl($m->avatar),
                ])->all()
                : [],
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
        $fields = [
            'description', 'enrollment_start', 'enrollment_deadline', 'course_end',
            'certificate_template_id',
        ];

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
     * Sau khi migration, DB lưu full URL (Supabase hoặc external).
     */
    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Bản ghi cũ còn lưu đường dẫn tương đối trên disk public (vd. course-thumbnails/x.jpg)
        return Str::startsWith($path, ['http://', 'https://']) ? $path : asset('storage/' . $path);
    }
}
