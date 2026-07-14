<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seed thêm nhiều chứng chỉ OFFLINE cho khoá "Python Nhập Môn".
 *
 * Dùng cho demo màn hình chứng chỉ (in chứng chỉ vật lý has_physical=true, danh sách
 * chứng chỉ trong CourseDetailPage...). Mỗi học viên offline được seed đầy đủ:
 * enrollment hoàn thành + QR ticket + điểm danh + lesson_progress + point_transactions
 * + chứng chỉ PDF thật (qua CourseCertificateService::issue → has_physical=true).
 *
 * Chạy sau LearningCenterSeeder + CertificateTemplateSeeder. Idempotent (updateOrInsert
 * + kiểm tra point_transactions trùng), có thể chạy lại nhiều lần.
 */
class PythonOfflineCertificateSeeder extends Seeder
{
    private const COURSE_SLUG = 'python-nhap-mon';

    /** Sinh viên Cao Thắng thật (có student_code) sẽ nhận chứng chỉ offline. */
    private const OFFLINE_STUDENT_EMAILS = [
        'student3@gmail.com',
        'student4@gmail.com',
        'student6@gmail.com',
        'student8@gmail.com',
        'student10@gmail.com',
    ];

    public function run(): void
    {
        $courseId = DB::table('courses')->where('slug', self::COURSE_SLUG)->value('id');
        if (! $courseId) {
            $this->command->warn('Khoá "Python Nhập Môn" chưa tồn tại — hãy chạy LearningCenterSeeder trước.');
            return;
        }

        $templateId = DB::table('certificate_templates')->where('is_default', true)->value('id');
        if (! $templateId) {
            $this->command->warn('Chưa có certificate_template nào — hãy chạy CertificateTemplateSeeder trước.');
            return;
        }

        // Backdate khoá về trạng thái "đã kết thúc" để dữ liệu nhất quán (idempotent).
        $enrollmentStart = now()->subDays(60);
        $enrollmentDeadline = now()->subDays(40);
        $courseEnd = now()->subDays(5);

        DB::table('courses')->where('id', $courseId)->update([
            'certificate_template_id' => $templateId,
            'enrollment_start' => $enrollmentStart,
            'enrollment_deadline' => $enrollmentDeadline,
            'course_end' => $courseEnd,
        ]);

        // Backdate session của từng buổi học về quá khứ (mỗi buổi cách nhau 1 tuần).
        $lessonIds = DB::table('lessons')
            ->where('course_id', $courseId)
            ->orderBy('order')
            ->pluck('id')
            ->all();

        foreach ($lessonIds as $i => $lessonId) {
            $sessionStart = $enrollmentDeadline->copy()->addDays($i * 7)->setTime(18, 0);
            DB::table('lessons')->where('id', $lessonId)->update([
                'session_start' => $sessionStart,
                'session_end' => $sessionStart->copy()->addHours(2),
            ]);
        }

        // Quiz phải published mới được tính vào điều kiện hoàn thành.
        DB::table('quizzes')->whereIn('lesson_id', $lessonIds)->update(['is_published' => true]);

        $lessons = DB::table('lessons')
            ->where('course_id', $courseId)
            ->orderBy('order')
            ->get(['id', 'session_start'])
            ->keyBy('id');

        $adminId = DB::table('users')->orderBy('id')->value('id');
        $completedAt = $courseEnd->copy()->addDay();

        // point_rules: [id => points] và [key => id]
        $pointsById = DB::table('point_rules')
            ->whereIn('key', [
                'learning_center.video_completed',
                'learning_center.quiz_passed',
                'learning_center.assignment_completed',
                'learning_center.course_completed',
            ])
            ->pluck('points', 'id')
            ->all();

        $ruleIdByKey = DB::table('point_rules')
            ->whereIn('key', [
                'learning_center.video_completed',
                'learning_center.quiz_passed',
                'learning_center.assignment_completed',
                'learning_center.course_completed',
            ])
            ->pluck('id', 'key')
            ->all();

        foreach (self::OFFLINE_STUDENT_EMAILS as $email) {
            $userId = DB::table('users')->where('email', $email)->value('id');
            if (! $userId) {
                $this->command->warn("User {$email} không tồn tại — bỏ qua.");
                continue;
            }

            $this->seedOfflineStudent(
                $userId,
                $courseId,
                $lessonIds,
                $lessons,
                $adminId,
                $enrollmentDeadline,
                $completedAt,
                $pointsById,
                $ruleIdByKey,
            );

            $this->command->info("✓ {$email} (offline) — enrollment + điểm danh + tiến độ + chứng chỉ đã seed.");
        }
    }

    private function seedOfflineStudent(
        int $userId,
        int $courseId,
        array $lessonIds,
        $lessons,
        ?int $adminId,
        Carbon $enrollmentDeadline,
        Carbon $completedAt,
        array $pointsById,
        array $ruleIdByKey,
    ): void {
        // Enrollment hoàn thành, track offline.
        DB::table('course_enrollments')->updateOrInsert(
            ['user_id' => $userId, 'course_id' => $courseId],
            [
                'track' => 'offline',
                'progress' => 100,
                'completed_at' => $completedAt,
                'created_at' => $enrollmentDeadline,
                'updated_at' => $completedAt,
            ]
        );

        // QR ticket + điểm danh cho từng buổi.
        foreach ($lessons as $lessonId => $lesson) {
            $attendedAt = Carbon::parse($lesson->session_start)->addMinutes(15);

            DB::table('lesson_qr_tickets')->updateOrInsert(
                ['user_id' => $userId, 'lesson_id' => $lessonId],
                [
                    'token' => Str::uuid()->toString(),
                    'used_at' => $attendedAt,
                    'created_at' => $enrollmentDeadline,
                    'updated_at' => $attendedAt,
                ]
            );

            DB::table('lesson_attendances')->updateOrInsert(
                ['user_id' => $userId, 'lesson_id' => $lessonId],
                [
                    'type' => 'qr',
                    'note' => null,
                    'attended_at' => $attendedAt,
                    'recorded_by' => $adminId,
                    'created_at' => $attendedAt,
                    'updated_at' => $attendedAt,
                ]
            );
        }

        // Lesson progress — video + assignment + quiz cho mỗi buổi.
        foreach ($lessonIds as $lessonId) {
            foreach (['video', 'assignment', 'quiz'] as $sectionType) {
                DB::table('lesson_progress')->updateOrInsert(
                    ['user_id' => $userId, 'lesson_id' => $lessonId, 'section_type' => $sectionType],
                    [
                        'is_completed' => true,
                        'score' => $sectionType === 'video' ? null : 90.00,
                        'watch_percentage' => $sectionType === 'video' ? 100 : null,
                        'completed_at' => $completedAt,
                        'created_at' => $enrollmentDeadline,
                        'updated_at' => $completedAt,
                    ]
                );
            }
        }

        // Point transactions — chỉ insert nếu chưa có (tránh trùng khi chạy lại).
        $totalAwarded = 0;
        $sectionRuleMap = [
            'video' => 'learning_center.video_completed',
            'quiz' => 'learning_center.quiz_passed',
            'assignment' => 'learning_center.assignment_completed',
        ];

        foreach ($lessonIds as $lessonId) {
            foreach ($sectionRuleMap as $sectionType => $ruleKey) {
                $ruleId = $ruleIdByKey[$ruleKey] ?? null;
                if (! $ruleId) {
                    continue;
                }

                $progressId = DB::table('lesson_progress')
                    ->where('user_id', $userId)
                    ->where('lesson_id', $lessonId)
                    ->where('section_type', $sectionType)
                    ->value('id');
                if (! $progressId) {
                    continue;
                }

                $alreadyExists = DB::table('point_transactions')
                    ->where('point_rule_id', $ruleId)
                    ->where('source_type', 'lesson_progress')
                    ->where('source_id', $progressId)
                    ->exists();
                if ($alreadyExists) {
                    continue;
                }

                $pts = $pointsById[$ruleId] ?? 0;
                DB::table('point_transactions')->insert([
                    'user_id' => $userId,
                    'point_rule_id' => $ruleId,
                    'points' => $pts,
                    'source_type' => 'lesson_progress',
                    'source_id' => $progressId,
                    'metadata' => null,
                    'created_at' => $completedAt,
                    'updated_at' => $completedAt,
                ]);
                $totalAwarded += $pts;
            }
        }

        // Điểm thưởng hoàn thành khoá.
        $courseRuleId = $ruleIdByKey['learning_center.course_completed'] ?? null;
        if ($courseRuleId) {
            $enrollmentId = DB::table('course_enrollments')
                ->where('user_id', $userId)->where('course_id', $courseId)->value('id');

            $alreadyExists = DB::table('point_transactions')
                ->where('point_rule_id', $courseRuleId)
                ->where('source_type', 'course_enrollment')
                ->where('source_id', $enrollmentId)
                ->exists();

            if (! $alreadyExists && $enrollmentId) {
                $pts = $pointsById[$courseRuleId] ?? 0;
                DB::table('point_transactions')->insert([
                    'user_id' => $userId,
                    'point_rule_id' => $courseRuleId,
                    'points' => $pts,
                    'source_type' => 'course_enrollment',
                    'source_id' => $enrollmentId,
                    'metadata' => null,
                    'created_at' => $completedAt,
                    'updated_at' => $completedAt,
                ]);
                $totalAwarded += $pts;
            }
        }

        if ($totalAwarded > 0) {
            DB::table('users')->where('id', $userId)->increment('total_points', $totalAwarded);
        }

        // Chứng chỉ — xoá cert cũ (nếu có) rồi gọi service sinh PDF thật (has_physical=true).
        DB::table('course_certificates')
            ->where(['user_id' => $userId, 'course_id' => $courseId, 'track' => 'offline'])
            ->delete();

        $enrollment = \App\Models\CourseEnrollment::with(['user', 'course.certificateTemplate'])
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($enrollment) {
            app(\App\Services\CourseCertificateService::class)->issue($enrollment);
        }
    }
}
