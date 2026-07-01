<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression tests for B2: QuizController sequential lock bypass.
 *
 * Before the fix, GET /quiz and POST /quiz/submit on a locked lesson returned 200
 * (the lock check was missing). After the fix both should return 403.
 */
class QuizSequentialLockTest extends TestCase
{
    use RefreshDatabase;

    private function makeCourse(User $creator): Course
    {
        return Course::create([
            'title' => 'Lock Test Course',
            'slug' => 'lock-test-course',
            'level' => 'beginner',
            'status' => 'published',
            'audience' => 'public',
            // max_offline_slots = null → fully online → sequential lock mode
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

    public function test_quiz_show_blocked_when_lesson_is_locked(): void
    {
        $creator = $this->makeUser('creator@test.com');
        $student = $this->makeUser('student@test.com');
        $course = $this->makeCourse($creator);

        $this->makeLesson($course, $creator, 1, 'buoi-1'); // lesson 1 — incomplete, so it's "open"
        $lesson2 = $this->makeLesson($course, $creator, 2, 'buoi-2'); // lesson 2 — locked

        Sanctum::actingAs($student);

        // lesson 2 is locked because lesson 1 is not yet completed
        $this->getJson("/api/v1/learning/courses/{$course->slug}/lessons/{$lesson2->slug}/quiz")
            ->assertForbidden()
            ->assertJsonPath('message', 'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.');
    }

    public function test_quiz_submit_blocked_when_lesson_is_locked(): void
    {
        $creator = $this->makeUser('creator2@test.com');
        $student = $this->makeUser('student2@test.com');
        $course = $this->makeCourse($creator);
        $course->slug = 'lock-test-course-2';
        $course->save();

        $this->makeLesson($course, $creator, 1, 'buoi-1b');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'buoi-2b');

        Sanctum::actingAs($student);

        $this->postJson("/api/v1/learning/courses/{$course->slug}/lessons/{$lesson2->slug}/quiz/submit", [
            'answers' => [['question_id' => 1, 'answer_data' => []]],
        ])->assertForbidden()
            ->assertJsonPath('message', 'Buổi học này đang bị khoá. Hãy hoàn thành buổi học trước để mở khoá.');
    }

    public function test_quiz_show_accessible_after_previous_lesson_completed(): void
    {
        $creator = $this->makeUser('creator3@test.com');
        $student = $this->makeUser('student3@test.com');
        $course = $this->makeCourse($creator);
        $course->slug = 'lock-test-course-3';
        $course->save();

        $lesson1 = $this->makeLesson($course, $creator, 1, 'buoi-1c');
        $lesson2 = $this->makeLesson($course, $creator, 2, 'buoi-2c');

        // Mark lesson 1 quiz as completed so lesson 2 becomes unlocked.
        // lessonProgressPercent for a lesson with only video: video section = 100% when video progress = completed.
        LessonProgress::create([
            'user_id' => $student->id,
            'lesson_id' => $lesson1->id,
            'section_type' => 'video',
            'is_completed' => true,
            'watch_percentage' => 100,
            'completed_at' => now(),
        ]);

        Sanctum::actingAs($student);

        // lesson 2 is now unlocked; no quiz exists yet → 404 (not 403)
        $this->getJson("/api/v1/learning/courses/{$course->slug}/lessons/{$lesson2->slug}/quiz")
            ->assertNotFound();
    }
}
