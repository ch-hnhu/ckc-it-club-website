<?php

namespace App\Services;

use App\Enums\CourseStatus;
use App\Enums\RolesEnum;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LessonAttendance;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Nghiệp vụ ghi danh khoá học — dùng chung cho học viên tự đăng ký
 * (User\CourseController::enroll) và admin ghi danh/đổi track/xoá ghi danh
 * thay học viên (Admin\CourseController). Cùng một bộ điều kiện cho cả hai
 * luồng: tư cách (@caothang.edu.vn hoặc thành viên CLB), cửa sổ thời gian
 * ghi danh, giới hạn `max_offline_slots` (chống race bằng lockForUpdate).
 */
class CourseEnrollmentService
{
    /**
     * Ghi danh user vào khoá học. abort_if (HttpException) khi không đủ điều kiện.
     */
    public function enroll(Course $course, User $user, string $track): CourseEnrollment
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        $this->assertEligible($user);

        abort_if(
            (bool) $course->enrollmentFor($user->id),
            422,
            'Đã ghi danh khoá học này rồi.'
        );

        $now = now();

        if ($track === 'offline') {
            $this->assertOfflineWindowOpen($course, $now);

            return DB::transaction(function () use ($course, $user) {
                $this->assertOfflineSlotAvailable($course);

                return CourseEnrollment::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'track' => 'offline',
                    'progress' => 0,
                ]);
            });
        }

        $this->assertOnlineWindowOpen($course, $now);

        return CourseEnrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'track' => 'online',
            'progress' => 0,
        ]);
    }

    /**
     * Đảm bảo user đã ghi danh khoá (tự ghi danh track online nếu chưa) — dùng khi
     * học viên bắt đầu học (xem video, làm quiz...): vào học là coi như đã ghi danh,
     * không cần bước ghi danh thủ công.
     *
     * Khác với ghi danh chủ động: KHÔNG áp cửa sổ thời gian (vẫn cho ghi nhận tiến độ
     * kể cả ngoài hạn ghi danh / sau khi khoá kết thúc, miễn user xem được nội dung).
     * Vẫn giữ điều kiện tư cách (sinh viên Cao Thắng / thành viên CLB).
     */
    public function ensureEnrolledOnline(Course $course, User $user): CourseEnrollment
    {
        if ($existing = $course->enrollmentFor($user->id)) {
            return $existing;
        }

        $this->assertEligible($user);

        return CourseEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            ['track' => 'online', 'progress' => 0],
        );
    }

    /**
     * Đổi track của một ghi danh đã có. Áp cùng điều kiện cửa sổ thời gian/slot
     * như ghi danh mới cho track đích.
     */
    public function changeTrack(CourseEnrollment $enrollment, string $newTrack): CourseEnrollment
    {
        abort_if($enrollment->track === $newTrack, 422, 'Học viên đã ở track này.');

        $course = $enrollment->course;
        $now = now();

        if ($newTrack === 'offline') {
            $this->assertOfflineWindowOpen($course, $now);

            DB::transaction(function () use ($course, $enrollment) {
                $this->assertOfflineSlotAvailable($course);
                $enrollment->update(['track' => 'offline']);
            });
        } else {
            $this->assertOnlineWindowOpen($course, $now);
            $enrollment->update(['track' => 'online']);
        }

        return app(CourseCompletionService::class)->recalc($enrollment->refresh());
    }

    /**
     * Xoá ghi danh + cascade xoá tiến độ/điểm danh của học viên trong khoá này.
     * Chứng chỉ đã cấp (course_certificates) được giữ lại vì là bằng chứng đã hoàn thành.
     */
    public function remove(CourseEnrollment $enrollment): void
    {
        DB::transaction(function () use ($enrollment) {
            $lessonIds = $enrollment->course->lessons()->pluck('id');

            LessonProgress::where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', $lessonIds)
                ->delete();

            LessonAttendance::where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', $lessonIds)
                ->delete();

            $enrollment->delete();
        });
    }

    /**
     * Tư cách ghi danh giống Sự kiện: email sinh viên Cao Thắng hoặc thành viên CLB
     * (có bất kỳ vai trò nào ngoài "user" thường).
     */
    private function assertEligible(User $user): void
    {
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
    }

    private function assertOfflineWindowOpen(Course $course, Carbon $now): void
    {
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
    }

    private function assertOfflineSlotAvailable(Course $course): void
    {
        $taken = $course->enrollments()
            ->where('track', 'offline')
            ->lockForUpdate()
            ->count();

        abort_if($taken >= $course->max_offline_slots, 422, 'Lớp offline đã đủ số lượng học viên.');
    }

    private function assertOnlineWindowOpen(Course $course, Carbon $now): void
    {
        abort_if(
            $course->course_end && $now->gt($course->course_end),
            422,
            'Khoá học đã kết thúc, không thể ghi danh học online.'
        );
    }
}
