<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression tests: CourseController::markVideoProgress sequential lock bypass.
 *
 * Cùng loại lỗi với QuizSequentialLockTest (B2) nhưng ở route ghi tiến độ video.
 * Trước khi vá, POST .../lessons/{slug}/progress trên buổi đang bị khoá trả 200
 * dù GET .../lessons/{slug} đã trả 403 — nên học viên gọi thẳng route này là đánh
 * dấu xong được mọi buổi, đạt 100% tiến độ và nhận chứng chỉ mà không xem buổi nào.
 */
class VideoProgressSequentialLockTest extends TestCase
{
    use RefreshDatabase;

    private function makeCourse(User $creator, string $slug): Course
    {
        return Course::create([
            'title' => 'Video Lock Test Course',
            'slug' => $slug,
            'level' => 'beginner',
            'status' => 'published',
            'audience' => 'public',
            // max_offline_slots = null → khoá online thuần → bật chặn tuần tự
            'quiz_pass_threshold' => 80,
            'created_by' => $creator->id,
        ]);
    }

    private function makeLesson(Course $course, User $creator, int $order, string $slug): Lesson
    {
        return Lesson::create([
            'course_id' => $course->id,
            'title' => "Buổi $order",
            'slug' => $slug,
            'order' => $order,
            'status' => 'published',
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'video_duration' => 120,
            'created_by' => $creator->id,
        ]);
    }

    private function makeUser(string $email): User
    {
        return User::create([
            'email' => $email,
            'username' => str($email)->before('@')->append('-', uniqid())->value(),
            'full_name' => 'Test User',
            'is_active' => true,
        ]);
    }

    private function progressUrl(Course $course, Lesson $lesson): string
    {
        return "/api/v1/learning/courses/{$course->slug}/lessons/{$lesson->slug}/progress";
    }

    public function test_video_progress_blocked_when_lesson_is_locked(): void
    {
        $creator = $this->makeUser('vcreator@test.com');
        $student = $this->makeUser('vstudent@test.com');
        $course = $this->makeCourse($creator, 'video-lock-course-1');

        $this->makeLesson($course, $creator, 1, 'v-buoi-1');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'v-buoi-2');

        Sanctum::actingAs($student);

        $this->postJson($this->progressUrl($course, $lesson2), ['watch_percentage' => 100])
            ->assertForbidden()
            ->assertJsonPath('message', 'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.');

        // Buổi bị khoá không được ghi nhận tiến độ.
        $this->assertDatabaseMissing('lesson_progress', [
            'user_id' => $student->id,
            'lesson_id' => $lesson2->id,
        ]);
    }

    public function test_blocked_progress_does_not_auto_enroll(): void
    {
        $creator = $this->makeUser('vcreator2@test.com');
        $student = $this->makeUser('vstudent2@test.com');
        $course = $this->makeCourse($creator, 'video-lock-course-2');

        $this->makeLesson($course, $creator, 1, 'v2-buoi-1');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'v2-buoi-2');

        Sanctum::actingAs($student);

        $this->postJson($this->progressUrl($course, $lesson2), ['watch_percentage' => 100])
            ->assertForbidden();

        // Request bị từ chối thì không được để lại ghi danh.
        $this->assertDatabaseMissing('course_enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_video_progress_allowed_on_first_open_lesson(): void
    {
        $creator = $this->makeUser('vcreator3@test.com');
        $student = $this->makeUser('vstudent3@test.com');
        $course = $this->makeCourse($creator, 'video-lock-course-3');

        $lesson1 = $this->makeLesson($course, $creator, 1, 'v3-buoi-1');
        $this->makeLesson($course, $creator, 2, 'v3-buoi-2');

        Sanctum::actingAs($student);

        $this->postJson($this->progressUrl($course, $lesson1), ['watch_percentage' => 100])
            ->assertOk()
            ->assertJsonPath('data.is_completed', true);

        // Học viên mới vào học buổi đầu vẫn được tự ghi danh track online.
        $this->assertDatabaseHas('course_enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'track' => 'online',
        ]);
    }

    public function test_video_progress_allowed_after_previous_lesson_completed(): void
    {
        $creator = $this->makeUser('vcreator4@test.com');
        $student = $this->makeUser('vstudent4@test.com');
        $course = $this->makeCourse($creator, 'video-lock-course-4');

        $lesson1 = $this->makeLesson($course, $creator, 1, 'v4-buoi-1');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'v4-buoi-2');

        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'track' => 'online',
            'progress' => 0,
        ]);

        LessonProgress::create([
            'user_id' => $student->id,
            'lesson_id' => $lesson1->id,
            'section_type' => 'video',
            'is_completed' => true,
            'watch_percentage' => 100,
            'completed_at' => now(),
        ]);

        Sanctum::actingAs($student);

        $this->postJson($this->progressUrl($course, $lesson2), ['watch_percentage' => 100])
            ->assertOk()
            ->assertJsonPath('data.is_completed', true);
    }

    public function test_partial_watch_on_previous_lesson_does_not_unlock_next(): void
    {
        $creator = $this->makeUser('vcreator5@test.com');
        $student = $this->makeUser('vstudent5@test.com');
        $course = $this->makeCourse($creator, 'video-lock-course-5');

        $lesson1 = $this->makeLesson($course, $creator, 1, 'v5-buoi-1');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'v5-buoi-2');

        Sanctum::actingAs($student);

        // 50% < ngưỡng 80% → buổi 1 chưa xong.
        $this->postJson($this->progressUrl($course, $lesson1), ['watch_percentage' => 50])
            ->assertOk()
            ->assertJsonPath('data.is_completed', false);

        $this->postJson($this->progressUrl($course, $lesson2), ['watch_percentage' => 100])
            ->assertForbidden();
    }
}
