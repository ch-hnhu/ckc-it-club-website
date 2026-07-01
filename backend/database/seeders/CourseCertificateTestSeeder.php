<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseCertificateTestSeeder extends Seeder
{
    private const COURSE_SLUG = 'python-nhap-mon';

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

        // Backdate khoá học về trạng thái "đã kết thúc" để dữ liệu nhất quán
        $enrollmentStart    = now()->subDays(60);
        $enrollmentDeadline = now()->subDays(40);
        $courseEnd          = now()->subDays(5);

        DB::table('courses')->where('id', $courseId)->update([
            'certificate_template_id' => $templateId,
            'enrollment_start'        => $enrollmentStart,
            'enrollment_deadline'     => $enrollmentDeadline,
            'course_end'              => $courseEnd,
        ]);

        // Backdate session của từng buổi học về quá khứ
        $lessonIds = DB::table('lessons')
            ->where('course_id', $courseId)
            ->orderBy('order')
            ->pluck('id')
            ->all();

        foreach ($lessonIds as $i => $lessonId) {
            // Buổi 1 bắt đầu ngay sau khi đóng đăng ký, mỗi buổi cách nhau 1 tuần
            $sessionStart = $enrollmentDeadline->copy()->addDays($i * 7)->setTime(18, 0);
            DB::table('lessons')->where('id', $lessonId)->update([
                'session_start' => $sessionStart,
                'session_end'   => $sessionStart->copy()->addHours(2),
            ]);
        }

        // Đọc session_start của từng buổi (đã được backdate ở trên)
        $lessons = DB::table('lessons')
            ->where('course_id', $courseId)
            ->orderBy('order')
            ->get(['id', 'session_start'])
            ->keyBy('id');

        $adminId     = DB::table('users')->orderBy('id')->value('id');
        $completedAt = $courseEnd->copy()->addDay();
        $issuedAt    = $completedAt->copy()->addDay();

        $candidates = [
            ['user_id' => 4, 'track' => 'offline'],
            ['user_id' => 5, 'track' => 'online'],
        ];

        foreach ($candidates as ['user_id' => $userId, 'track' => $track]) {
            if (! DB::table('users')->where('id', $userId)->exists()) {
                $this->command->warn("User {$userId} không tồn tại — bỏ qua.");
                continue;
            }

            // Enrollment
            DB::table('course_enrollments')->updateOrInsert(
                ['user_id' => $userId, 'course_id' => $courseId],
                [
                    'track'        => $track,
                    'progress'     => 100,
                    'completed_at' => $completedAt,
                    'created_at'   => $enrollmentDeadline,
                    'updated_at'   => $completedAt,
                ]
            );

            // QR ticket + điểm danh — chỉ áp dụng cho track offline
            if ($track === 'offline') {
                foreach ($lessons as $lessonId => $lesson) {
                    // Điểm danh lúc 18:15 (15 phút sau khi buổi bắt đầu)
                    $attendedAt = \Illuminate\Support\Carbon::parse($lesson->session_start)->addMinutes(15);

                    // 1. QR ticket được phát trước buổi học (khi đăng ký khoá)
                    DB::table('lesson_qr_tickets')->updateOrInsert(
                        ['user_id' => $userId, 'lesson_id' => $lessonId],
                        [
                            'token'      => Str::uuid()->toString(),
                            'used_at'    => $attendedAt, // đã quét
                            'created_at' => $enrollmentDeadline,
                            'updated_at' => $attendedAt,
                        ]
                    );

                    // 2. Attendance ghi nhận sau khi quét QR
                    DB::table('lesson_attendances')->updateOrInsert(
                        ['user_id' => $userId, 'lesson_id' => $lessonId],
                        [
                            'type'        => 'qr',
                            'note'        => null,
                            'attended_at' => $attendedAt,
                            'recorded_by' => $adminId,
                            'created_at'  => $attendedAt,
                            'updated_at'  => $attendedAt,
                        ]
                    );
                }
            }

            // Lesson progress — video + assignment + quiz cho mỗi bài
            foreach ($lessonIds as $lessonId) {
                foreach (['video', 'assignment', 'quiz'] as $sectionType) {
                    DB::table('lesson_progress')->updateOrInsert(
                        ['user_id' => $userId, 'lesson_id' => $lessonId, 'section_type' => $sectionType],
                        [
                            'is_completed'     => true,
                            'score'            => $sectionType === 'video' ? null : 90.00,
                            'watch_percentage' => $sectionType === 'video' ? 100 : null,
                            'completed_at'     => $completedAt,
                            'created_at'       => $enrollmentDeadline,
                            'updated_at'       => $completedAt,
                        ]
                    );
                }
            }

            // Course certificate
            DB::table('course_certificates')->updateOrInsert(
                ['user_id' => $userId, 'course_id' => $courseId, 'track' => $track],
                [
                    'template_id'  => $templateId,
                    'cert_code'    => strtoupper(Str::random(4).'-'.Str::random(4).'-'.Str::random(4)),
                    'cert_url'     => null,
                    'has_physical' => $track === 'offline',
                    'issued_at'    => $issuedAt,
                    'revoked_at'   => null,
                    'revoked_by'   => null,
                    'created_at'   => $issuedAt,
                    'updated_at'   => $issuedAt,
                ]
            );

            $this->command->info("✓ User {$userId} ({$track}) — enrollment + attendance + lesson_progress + certificate đã được seed.");
        }
    }
}
