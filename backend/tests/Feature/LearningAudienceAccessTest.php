<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LearningAudienceAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_enrollment_does_not_bypass_current_course_audience(): void
    {
        $creator = $this->createUser('creator@example.com');
        $viewer = $this->createUser('outsider@example.com');
        $course = $this->createCourse($creator, 'cao-thang-only', 'cao_thang_student');
        $lesson = $this->createVideoLesson($course, $creator);

        CourseEnrollment::create([
            'user_id' => $viewer->id,
            'course_id' => $course->id,
            'track' => 'online',
            'progress' => 0,
        ]);

        Sanctum::actingAs($viewer);

        $this->getJson("/api/v1/learning/courses/{$course->slug}/lessons/{$lesson->slug}/videos/video")
            ->assertForbidden()
            ->assertJsonPath('message', 'Chỉ tài khoản sinh viên Cao Thắng mới được học khoá học này.');
    }

    public function test_online_video_with_null_session_start_can_open_for_matching_audience(): void
    {
        $creator = $this->createUser('creator@example.com');
        $viewer = $this->createUser('0306231234@caothang.edu.vn');
        $course = $this->createCourse($creator, 'online-course', 'cao_thang_student');
        $lesson = $this->createVideoLesson($course, $creator);

        Sanctum::actingAs($viewer);

        $this->getJson("/api/v1/learning/courses/{$course->slug}/lessons/{$lesson->slug}/videos/video")
            ->assertOk()
            ->assertJsonPath('data.lecture_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }

    private function createUser(string $email): User
    {
        return User::create([
            'email' => $email,
            'username' => str($email)->before('@')->append('-', uniqid())->value(),
            'full_name' => 'Test User',
            'is_active' => true,
        ]);
    }

    private function createCourse(User $creator, string $slug, string $audience): Course
    {
        return Course::create([
            'title' => 'Test Course',
            'slug' => $slug,
            'level' => 'beginner',
            'status' => 'published',
            'audience' => $audience,
            'max_absent_allowed' => 1,
            'quiz_pass_threshold' => 80,
            'created_by' => $creator->id,
        ]);
    }

    private function createVideoLesson(Course $course, User $creator): Lesson
    {
        return Lesson::create([
            'course_id' => $course->id,
            'title' => 'Buổi 1',
            'slug' => 'buoi-1',
            'order' => 1,
            'status' => 'published',
            'session_start' => null,
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'video_duration' => 120,
            'created_by' => $creator->id,
        ]);
    }
}
