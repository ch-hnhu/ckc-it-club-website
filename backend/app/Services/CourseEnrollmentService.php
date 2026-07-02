<?php

namespace App\Services;

use App\Enums\CourseAudience;
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
 * (User\CourseController::enroll) và admin ghi danh/xoá ghi danh thay học viên
 * (Admin\CourseController). Cùng một bộ điều kiện cho cả hai luồng: đối tượng
 * của khoá học, cửa sổ thời gian ghi danh, giới hạn `max_offline_slots`
 * (chống race bằng lockForUpdate).
 *
 * Track của một ghi danh là cố định — chọn lúc ghi danh, không có cơ chế đổi
 * track sau đó. Lý do: course_certificates unique theo (user_id, course_id, track),
 * nên nếu track có thể đổi, một học viên có thể lần lượt hoàn thành cả 2 track
 * và nhận 2 chứng chỉ cho cùng 1 khoá — không đúng với nghiệp vụ mong muốn
 * (1 khoá chỉ 1 track, 1 loại chứng chỉ cho mỗi học viên).
 */
class CourseEnrollmentService
{
    /**
     * Ghi danh user vào khoá học. abort_if (HttpException) khi không đủ điều kiện.
     */
    public function enroll(Course $course, User $user, string $track): CourseEnrollment
    {
        abort_if($course->status !== CourseStatus::PUBLISHED, 404);

        abort_if(
            (bool) $course->enrollmentFor($user->id),
            422,
            'Đã ghi danh khoá học này rồi.'
        );

        $this->assertMatchesAudience($course, $user);

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
     * Vẫn giữ điều kiện đối tượng học của khoá.
     */
    public function ensureEnrolledOnline(Course $course, User $user): CourseEnrollment
    {
        $this->assertMatchesAudience($course, $user);

        if ($existing = $course->enrollmentFor($user->id)) {
            return $existing;
        }

        return CourseEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            ['track' => 'online', 'progress' => 0],
        );
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
     * Người học được phép mở nội dung khi tài khoản khớp đối tượng hiện tại
     * của khoá. Enrollment cũ không được bypass audience vì admin có thể đổi
     * phạm vi học sau khi khoá đã có học viên.
     */
    public function canLearn(Course $course, ?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->matchesAudience($course, $user);
    }

    public function assertCanLearn(Course $course, ?User $user): void
    {
        abort_if(! $user, 401, 'Vui lòng đăng nhập để học khoá học này.');

        abort_if(
            ! $this->canLearn($course, $user),
            403,
            $this->audienceErrorMessage($course->audience)
        );
    }

    private function assertMatchesAudience(Course $course, User $user): void
    {
        abort_if(
            ! $this->matchesAudience($course, $user),
            422,
            $this->audienceErrorMessage($course->audience)
        );
    }

    private function matchesAudience(Course $course, User $user): bool
    {
        return match ($course->audience) {
            CourseAudience::PUBLIC => true,
            CourseAudience::CAO_THANG_STUDENT => $user->isSchoolStudent(),
            CourseAudience::CLUB_MEMBER => $this->isClubMember($user),
        };
    }

    /**
     * Thành viên CLB được hiểu là tài khoản có bất kỳ vai trò hệ thống nào
     * ngoài vai trò "user" thường.
     */
    private function isClubMember(User $user): bool
    {
        $memberRoles = array_values(array_filter(
            array_map(fn (RolesEnum $case) => $case->value, RolesEnum::cases()),
            fn (string $role) => $role !== RolesEnum::USER->value,
        ));

        return $user->hasAnyRole($memberRoles);
    }

    private function audienceErrorMessage(CourseAudience $audience): string
    {
        return match ($audience) {
            CourseAudience::CLUB_MEMBER => 'Chỉ thành viên câu lạc bộ mới được học khoá học này.',
            CourseAudience::CAO_THANG_STUDENT => 'Chỉ tài khoản sinh viên Cao Thắng mới được học khoá học này.',
            CourseAudience::PUBLIC => 'Vui lòng đăng nhập để học khoá học này.',
        };
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
