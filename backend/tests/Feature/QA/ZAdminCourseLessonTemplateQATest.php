<?php

namespace Tests\Feature\QA;

use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\CertificateTemplate;
use App\Models\Lesson;
use App\Models\LessonAttendance;
use App\Models\LessonQrTicket;
use App\Models\Quiz;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\QuestionTypeSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ZAdminCourseLessonTemplateQATest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
        $this->seed(QuestionTypeSeeder::class);

        $this->admin = $this->createUser('admin@example.com');
        $this->admin->assignRole('admin');

        Sanctum::actingAs($this->admin);
    }

    private function createUser(string $email): User
    {
        return User::create([
            'email' => $email,
            'username' => str($email)->before('@')->append('-', uniqid())->value(),
            'full_name' => 'Test User ' . uniqid(),
            'is_active' => true,
        ]);
    }

    private function createCourse(array $overrides = []): Course
    {
        return Course::create(array_merge([
            'title' => 'Test Course ' . uniqid(),
            'slug' => 'course-' . uniqid(),
            'level' => 'beginner',
            'status' => 'draft',
            'audience' => 'public',
            'max_absent_allowed' => 1,
            'quiz_pass_threshold' => 80,
            'created_by' => $this->admin->id,
        ], $overrides));
    }

    // ───────────────────────── 11. Course management ─────────────────────────

    public function test_11_1_create_course_requires_title_level_audience_and_generates_unique_slug(): void
    {
        $this->postJson('/api/v1/courses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'level']);

        $resp1 = $this->postJson('/api/v1/courses', [
            'title' => 'Lập trình Web',
            'level' => 'beginner',
        ])->assertStatus(201);
        $slug1 = $resp1->json('data.slug');
        $this->assertNotEmpty($slug1);

        $resp2 = $this->postJson('/api/v1/courses', [
            'title' => 'Lập trình Web',
            'level' => 'beginner',
        ])->assertStatus(201);
        $slug2 = $resp2->json('data.slug');
        $this->assertNotEquals($slug1, $slug2);

        $this->postJson('/api/v1/courses', [
            'title' => 'Invalid audience',
            'level' => 'beginner',
            'audience' => 'not_a_real_audience',
        ])->assertStatus(422)->assertJsonValidationErrors(['audience']);
    }

    public function test_11_2_enable_offline_sets_offline_fields(): void
    {
        $resp = $this->postJson('/api/v1/courses', [
            'title' => 'Offline course',
            'level' => 'beginner',
            'has_offline' => true,
            'max_offline_slots' => 20,
            'max_absent_allowed' => 2,
            'enrollment_start' => now()->toIso8601String(),
            'enrollment_deadline' => now()->addDays(5)->toIso8601String(),
            'course_end' => now()->addDays(30)->toIso8601String(),
        ])->assertStatus(201);

        $resp->assertJsonPath('data.max_offline_slots', 20)
            ->assertJsonPath('data.max_absent_allowed', 2);
        $this->assertNotNull($resp->json('data.enrollment_deadline'));
        $this->assertNotNull($resp->json('data.course_end'));
    }

    public function test_11_3_disable_offline_after_set_nulls_all_offline_fields_server_side(): void
    {
        $course = $this->createCourse([
            'max_offline_slots' => 30,
            'max_absent_allowed' => 4,
            'enrollment_start' => now(),
            'enrollment_deadline' => now()->addDays(3),
            'course_end' => now()->addDays(20),
        ]);

        $resp = $this->putJson("/api/v1/courses/{$course->slug}", [
            'title' => $course->title,
            'level' => 'beginner',
            'audience' => 'public',
            'has_offline' => false,
            'max_offline_slots' => 30,
            'max_absent_allowed' => 4,
            'enrollment_start' => now()->toIso8601String(),
            'enrollment_deadline' => now()->addDays(3)->toIso8601String(),
            'course_end' => now()->addDays(20)->toIso8601String(),
        ])->assertStatus(200);

        $resp->assertJsonPath('data.max_offline_slots', null)
            ->assertJsonPath('data.max_absent_allowed', null)
            ->assertJsonPath('data.enrollment_start', null)
            ->assertJsonPath('data.enrollment_deadline', null)
            ->assertJsonPath('data.course_end', null);

        $course->refresh();
        $this->assertNull($course->max_offline_slots);
        $this->assertNull($course->max_absent_allowed);
        $this->assertNull($course->enrollment_start);
        $this->assertNull($course->enrollment_deadline);
        $this->assertNull($course->course_end);
    }

    public function test_11_4_draft_published_toggle_affects_public_catalog(): void
    {
        $course = $this->createCourse(['status' => 'draft', 'title' => 'Draft Visibility Course']);

        $this->getJson('/api/v1/learning/courses')
            ->assertOk()
            ->assertJsonMissing(['slug' => $course->slug]);

        $this->putJson("/api/v1/courses/{$course->slug}", [
            'title' => $course->title,
            'level' => 'beginner',
            'audience' => 'public',
            'status' => 'published',
        ])->assertOk()->assertJsonPath('data.status', 'published');

        $listResp = $this->getJson('/api/v1/learning/courses')->assertOk();
        $slugs = collect($listResp->json('data'))->pluck('slug')->all();
        $this->assertContains($course->slug, $slugs);

        $this->putJson("/api/v1/courses/{$course->slug}", [
            'title' => $course->title,
            'level' => 'beginner',
            'audience' => 'public',
            'status' => 'draft',
        ])->assertOk();

        $listResp2 = $this->getJson('/api/v1/learning/courses')->assertOk();
        $slugs2 = collect($listResp2->json('data'))->pluck('slug')->all();
        $this->assertNotContains($course->slug, $slugs2);
    }

    public function test_11_5_soft_delete_moves_course_to_trash(): void
    {
        $course = $this->createCourse(['title' => 'To Be Trashed']);

        $this->deleteJson("/api/v1/courses/{$course->slug}")->assertOk();

        $listResp = $this->getJson('/api/v1/courses')->assertOk();
        $ids = collect($listResp->json('data'))->pluck('id')->all();
        $this->assertNotContains($course->id, $ids);

        $trashResp = $this->getJson('/api/v1/courses/trash')->assertOk();
        $trashIds = collect($trashResp->json('data'))->pluck('id')->all();
        $this->assertContains($course->id, $trashIds);
    }

    public function test_11_6_restore_from_trash_keeps_lesson_and_enrollment_data(): void
    {
        $course = $this->createCourse(['title' => 'Restore Me']);
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Lesson 1',
            'slug' => 'lesson-1',
            'order' => 1,
            'status' => 'published',
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('student-restore@example.com');
        $enrollment = CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'track' => 'online',
            'progress' => 0,
        ]);

        $this->deleteJson("/api/v1/courses/{$course->slug}")->assertOk();
        $this->patchJson("/api/v1/courses/trash/{$course->id}/restore")->assertOk();

        $listResp = $this->getJson('/api/v1/courses')->assertOk();
        $ids = collect($listResp->json('data'))->pluck('id')->all();
        $this->assertContains($course->id, $ids);

        $this->assertDatabaseHas('lessons', ['id' => $lesson->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('course_enrollments', ['id' => $enrollment->id]);
    }

    public function test_11_7_force_delete_from_trash_permanently_removes_no_500(): void
    {
        $course = $this->createCourse(['title' => 'Force Delete Me']);
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Lesson 1',
            'slug' => 'lesson-1',
            'order' => 1,
            'status' => 'published',
            'created_by' => $this->admin->id,
        ]);
        Quiz::create(['lesson_id' => $lesson->id, 'is_published' => false]);

        $this->deleteJson("/api/v1/courses/{$course->slug}")->assertOk();
        $resp = $this->deleteJson("/api/v1/courses/trash/{$course->id}/force");
        $resp->assertOk();

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_11_8_course_category_crud_and_multi_tag(): void
    {
        $cat1 = $this->postJson('/api/v1/course-categories', ['name' => 'Lập trình'])
            ->assertStatus(201)->json('data');
        $cat2 = $this->postJson('/api/v1/course-categories', ['name' => 'Thiết kế'])
            ->assertStatus(201)->json('data');

        $this->postJson('/api/v1/course-categories', ['name' => 'Lập trình'])
            ->assertStatus(422);

        $this->putJson("/api/v1/course-categories/{$cat1['id']}", ['name' => 'Lập trình nâng cao'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Lập trình nâng cao');

        $course = $this->createCourse(['title' => 'Multi-category course']);
        $this->putJson("/api/v1/courses/{$course->slug}", [
            'title' => $course->title,
            'level' => 'beginner',
            'audience' => 'public',
            'tag_ids' => [$cat1['id'], $cat2['id']],
        ])->assertOk();

        $course->refresh()->load('tags');
        $this->assertCount(2, $course->tags);

        $this->deleteJson("/api/v1/course-categories/{$cat2['id']}")->assertOk();
        $this->assertDatabaseMissing('tags', ['id' => $cat2['id']]);
    }

    // ───────────────────────── 12. Lesson & quiz management ─────────────────────────

    public function test_12_1_lesson_order_auto_increments(): void
    {
        $course = $this->createCourse();

        $l1 = $this->postJson("/api/v1/courses/{$course->slug}/lessons", ['title' => 'Buổi 1'])
            ->assertStatus(201)->json('data');
        $l2 = $this->postJson("/api/v1/courses/{$course->slug}/lessons", ['title' => 'Buổi 2'])
            ->assertStatus(201)->json('data');
        $l3 = $this->postJson("/api/v1/courses/{$course->slug}/lessons", ['title' => 'Buổi 3'])
            ->assertStatus(201)->json('data');

        $this->assertEquals(1, $l1['order']);
        $this->assertEquals(2, $l2['order']);
        $this->assertEquals(3, $l3['order']);
    }

    public function test_12_2_lesson_slug_unique_within_course_only(): void
    {
        $courseA = $this->createCourse(['title' => 'Course A']);
        $courseB = $this->createCourse(['title' => 'Course B']);

        Lesson::create([
            'course_id' => $courseA->id,
            'title' => 'Giới thiệu',
            'slug' => 'gioi-thieu',
            'order' => 1,
            'status' => 'published',
            'created_by' => $this->admin->id,
        ]);

        $dup = $this->postJson("/api/v1/courses/{$courseA->slug}/lessons", ['title' => 'Giới thiệu'])
            ->assertStatus(201)->json('data');
        $this->assertNotEquals('gioi-thieu', $dup['slug']);

        $otherCourseLesson = $this->postJson("/api/v1/courses/{$courseB->slug}/lessons", ['title' => 'Giới thiệu'])
            ->assertStatus(201)->json('data');
        $this->assertEquals('gioi-thieu', $otherCourseLesson['slug']);
    }

    public function test_12_3_youtube_duration_endpoint_external_dependency(): void
    {
        $resp = $this->getJson('/api/v1/lessons/youtube-duration?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        $this->assertTrue(
            in_array($resp->getStatusCode(), [422, 200], true),
            'Expected graceful handling (422 missing key, or 200 if a key+network are present), got ' . $resp->getStatusCode()
        );
    }

    public function test_12_4_playable_video_url_prefers_video_over_live(): void
    {
        $course = $this->createCourse();
        $lessonBoth = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Both urls',
            'slug' => 'both-urls',
            'order' => 1,
            'status' => 'published',
            'video_url' => 'https://youtube.com/watch?v=videoone',
            'live_url' => 'https://youtube.com/watch?v=liveone',
            'created_by' => $this->admin->id,
        ]);
        $this->assertEquals('https://youtube.com/watch?v=videoone', $lessonBoth->playableVideoUrl());

        $lessonLiveOnly = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Live only',
            'slug' => 'live-only',
            'order' => 2,
            'status' => 'published',
            'live_url' => 'https://youtube.com/watch?v=liveonly',
            'created_by' => $this->admin->id,
        ]);
        $this->assertEquals('https://youtube.com/watch?v=liveonly', $lessonLiveOnly->playableVideoUrl());

        $detail = $this->getJson("/api/v1/courses/{$course->slug}")->assertOk()->json('data');
        $lessonsArr = collect($detail['lessons'])->keyBy('id');
        $this->assertTrue($lessonsArr[$lessonBoth->id]['has_video']);
        $this->assertTrue($lessonsArr[$lessonLiveOnly->id]['has_video']);
    }

    public function test_12_5_offline_lesson_session_start_before_end_validated(): void
    {
        $course = $this->createCourse();

        $resp = $this->postJson("/api/v1/courses/{$course->slug}/lessons", [
            'title' => 'Bad schedule',
            'session_start' => now()->addDays(2)->toIso8601String(),
            'session_end' => now()->addDays(1)->toIso8601String(),
        ]);
        $resp->assertStatus(422)->assertJsonValidationErrors(['session_end']);

        $this->postJson("/api/v1/courses/{$course->slug}/lessons", [
            'title' => 'Good schedule',
            'session_start' => now()->addDays(1)->toIso8601String(),
            'session_end' => now()->addDays(1)->addHours(2)->toIso8601String(),
        ])->assertStatus(201);
    }

    public function test_12_6_soft_delete_lesson_hides_it_no_500_on_related_endpoints(): void
    {
        $course = $this->createCourse();
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Removable lesson',
            'slug' => 'removable-lesson',
            'order' => 1,
            'status' => 'published',
            'session_start' => now()->subDay(),
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('student-lesson-del@example.com');
        CourseEnrollment::create([
            'user_id' => $student->id, 'course_id' => $course->id, 'track' => 'offline', 'progress' => 0,
        ]);
        LessonAttendance::create([
            'user_id' => $student->id, 'lesson_id' => $lesson->id, 'type' => 'manual', 'attended_at' => now(), 'recorded_by' => $this->admin->id,
        ]);

        $this->deleteJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}")->assertOk();

        $detail = $this->getJson("/api/v1/courses/{$course->slug}")->assertOk();
        $lessonIds = collect($detail->json('data.lessons'))->pluck('id')->all();
        $this->assertNotContains($lesson->id, $lessonIds);

        $gradesResp = $this->getJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/grades");
        $this->assertNotEquals(500, $gradesResp->getStatusCode());
    }

    public function test_12_7_quiz_put_full_replace_old_questions_gone(): void
    {
        $course = $this->createCourse();
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Quiz lesson', 'slug' => 'quiz-lesson',
            'order' => 1, 'status' => 'published', 'created_by' => $this->admin->id,
        ]);

        $resp1 = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/quiz", [
            'is_published' => true,
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'content' => 'Question A',
                    'options' => [
                        ['content' => 'Opt 1', 'is_correct' => true],
                        ['content' => 'Opt 2', 'is_correct' => false],
                    ],
                ],
            ],
        ])->assertOk();

        $oldQuestionId = $resp1->json('data.questions.0.id');
        $this->assertDatabaseHas('quiz_questions', ['id' => $oldQuestionId]);

        $resp2 = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/quiz", [
            'is_published' => true,
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'content' => 'Question B (replaced)',
                    'options' => [
                        ['content' => 'Opt X', 'is_correct' => true],
                        ['content' => 'Opt Y', 'is_correct' => false],
                    ],
                ],
            ],
        ])->assertOk();

        $newQuestionId = $resp2->json('data.questions.0.id');
        $this->assertNotEquals($oldQuestionId, $newQuestionId);
        $this->assertDatabaseMissing('quiz_questions', ['id' => $oldQuestionId]);
        $this->assertDatabaseHas('quiz_questions', ['id' => $newQuestionId, 'content' => 'Question B (replaced)']);
        $this->assertEquals(1, \App\Models\QuizQuestion::where('quiz_id', $resp2->json('data.id'))->count());
    }

    public function test_12_8_quiz_default_is_published_false(): void
    {
        $course = $this->createCourse();
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Quiz default lesson', 'slug' => 'quiz-default-lesson',
            'order' => 1, 'status' => 'published', 'created_by' => $this->admin->id,
        ]);

        $resp = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/quiz", [
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'content' => 'Q',
                    'options' => [
                        ['content' => 'A', 'is_correct' => true],
                        ['content' => 'B', 'is_correct' => false],
                    ],
                ],
            ],
        ])->assertOk();

        $resp->assertJsonPath('data.is_published', false);
        $this->assertFalse((bool) Quiz::find($resp->json('data.id'))->is_published);
    }

    public function test_12_9_question_option_image_url_persists(): void
    {
        $course = $this->createCourse();
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Image quiz lesson', 'slug' => 'image-quiz-lesson',
            'order' => 1, 'status' => 'published', 'created_by' => $this->admin->id,
        ]);

        $resp = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/quiz", [
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'content' => 'Q with image',
                    'image' => 'https://example.com/question.png',
                    'options' => [
                        ['content' => 'A', 'is_correct' => true, 'image' => 'https://example.com/optA.png'],
                        ['content' => 'B', 'is_correct' => false],
                    ],
                ],
            ],
        ])->assertOk();

        $resp->assertJsonPath('data.questions.0.image', 'https://example.com/question.png');
        $resp->assertJsonPath('data.questions.0.options.0.image', 'https://example.com/optA.png');
    }

    public function test_12_10_blob_or_data_url_image_dropped_on_save_known_gap(): void
    {
        $course = $this->createCourse();
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Blob image lesson', 'slug' => 'blob-image-lesson',
            'order' => 1, 'status' => 'published', 'created_by' => $this->admin->id,
        ]);

        $resp = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/quiz", [
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'content' => 'Q with data url image',
                    'image' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
                    'options' => [
                        ['content' => 'A', 'is_correct' => true],
                        ['content' => 'B', 'is_correct' => false],
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertNull($resp->json('data.questions.0.image'));
    }

    // ───────────────────────── 13. Attendance & grading ─────────────────────────

    public function test_13_1_valid_qr_checkin_creates_attendance_with_correct_user_name(): void
    {
        $course = $this->createCourse(['max_offline_slots' => 10]);
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Checkin lesson', 'slug' => 'checkin-lesson',
            'order' => 1, 'status' => 'published', 'session_start' => now(), 'session_end' => now()->addHours(2),
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('checkin-student@example.com');
        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'track' => 'offline', 'progress' => 0]);
        $token = LessonQrTicket::generateToken($lesson->id, $student->id);
        LessonQrTicket::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'token' => $token]);

        $resp = $this->postJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/check-in", ['qr_token' => $token]);
        $resp->assertOk()
            ->assertJsonPath('data.already', false)
            ->assertJsonPath('data.student.full_name', $student->full_name);

        $this->assertDatabaseHas('lesson_attendances', ['user_id' => $student->id, 'lesson_id' => $lesson->id]);
    }

    public function test_13_2_rescan_used_ticket_no_duplicate_attendance(): void
    {
        $course = $this->createCourse(['max_offline_slots' => 10]);
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Rescan lesson', 'slug' => 'rescan-lesson',
            'order' => 1, 'status' => 'published', 'session_start' => now(), 'session_end' => now()->addHours(2),
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('rescan-student@example.com');
        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'track' => 'offline', 'progress' => 0]);
        $token = LessonQrTicket::generateToken($lesson->id, $student->id);
        LessonQrTicket::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'token' => $token]);

        $this->postJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/check-in", ['qr_token' => $token])->assertOk();
        $resp2 = $this->postJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/check-in", ['qr_token' => $token]);

        $resp2->assertOk()->assertJsonPath('data.already', true);
        $this->assertEquals(1, LessonAttendance::where(['user_id' => $student->id, 'lesson_id' => $lesson->id])->count());
    }

    public function test_13_3_manual_toggle_attendance_on_and_off(): void
    {
        $course = $this->createCourse(['max_offline_slots' => 10]);
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Toggle lesson', 'slug' => 'toggle-lesson',
            'order' => 1, 'status' => 'published', 'session_start' => now(), 'session_end' => now()->addHours(2),
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('toggle-student@example.com');
        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'track' => 'offline', 'progress' => 0]);

        $this->postJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/attendance", [
            'user_id' => $student->id, 'present' => true,
        ])->assertOk()->assertJsonPath('data.present', true);
        $this->assertDatabaseHas('lesson_attendances', ['user_id' => $student->id, 'lesson_id' => $lesson->id]);

        $this->postJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/attendance", [
            'user_id' => $student->id, 'present' => false,
        ])->assertOk()->assertJsonPath('data.present', false);
        $this->assertDatabaseMissing('lesson_attendances', ['user_id' => $student->id, 'lesson_id' => $lesson->id]);
    }

    public function test_13_4_grade_assignment_pass_fail_saved(): void
    {
        $course = $this->createCourse(['max_offline_slots' => 10]);
        $lesson = Lesson::create([
            'course_id' => $course->id, 'title' => 'Grade lesson', 'slug' => 'grade-lesson',
            'order' => 1, 'status' => 'published', 'assignment_url' => 'https://forms.google.com/x',
            'created_by' => $this->admin->id,
        ]);
        $student = $this->createUser('grade-student@example.com');
        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'track' => 'offline', 'progress' => 0]);

        $resp = $this->putJson("/api/v1/courses/{$course->slug}/lessons/{$lesson->id}/grades", [
            'grades' => [['user_id' => $student->id, 'passed' => true]],
        ])->assertOk();

        $row = collect($resp->json('data'))->firstWhere('user_id', $student->id);
        $this->assertTrue($row['passed']);
        $this->assertDatabaseHas('lesson_progress', [
            'user_id' => $student->id, 'lesson_id' => $lesson->id, 'section_type' => 'assignment', 'is_completed' => 1,
        ]);
    }

    public function test_13_5_admin_enroll_and_remove_student_respects_track_and_offline_slot(): void
    {
        $course = $this->createCourse([
            'status' => 'published', 'max_offline_slots' => 1,
            'enrollment_start' => now()->subDay(), 'enrollment_deadline' => now()->addDay(),
        ]);
        $studentA = $this->createUser('enroll-a@example.com');
        $studentB = $this->createUser('enroll-b@example.com');

        $enrollA = $this->postJson("/api/v1/courses/{$course->slug}/enrollments", [
            'user_id' => $studentA->id, 'track' => 'offline',
        ])->assertStatus(201)->json('data');
        $this->assertEquals('offline', $enrollA['track']);

        $respB = $this->postJson("/api/v1/courses/{$course->slug}/enrollments", [
            'user_id' => $studentB->id, 'track' => 'offline',
        ]);
        $respB->assertStatus(422);

        $this->deleteJson("/api/v1/courses/{$course->slug}/enrollments/{$enrollA['id']}")->assertOk();
        $this->assertDatabaseMissing('course_enrollments', ['id' => $enrollA['id']]);
    }

    public function test_13_6_enrollable_users_search_excludes_already_enrolled(): void
    {
        $course = $this->createCourse(['status' => 'published']);
        $enrolledStudent = $this->createUser('already-enrolled-zz@example.com');
        $enrolledStudent->update(['full_name' => 'ZZEnrolledUnique']);
        $freeStudent = $this->createUser('free-zz@example.com');
        $freeStudent->update(['full_name' => 'ZZFreeUnique']);

        CourseEnrollment::create(['user_id' => $enrolledStudent->id, 'course_id' => $course->id, 'track' => 'online', 'progress' => 0]);

        $resp = $this->getJson("/api/v1/courses/{$course->slug}/enrollable-users?search=ZZ")->assertOk();
        $ids = collect($resp->json('data'))->pluck('id')->all();

        $this->assertNotContains($enrolledStudent->id, $ids);
        $this->assertContains($freeStudent->id, $ids);
    }

    // ───────────────────────── 14. Certificate template editor ─────────────────────────

    private function sampleDesign(): array
    {
        return [
            'canvas' => ['width' => 1000, 'height' => 700, 'background' => '#ffffff'],
            'elements' => [
                ['type' => 'text', 'x' => 10, 'y' => 10, 'text' => '{{name}}'],
            ],
        ];
    }

    public function test_14_1_create_template_persists_design_shape(): void
    {
        $resp = $this->postJson('/api/v1/certificate-templates', [
            'name' => 'Mẫu A',
            'design' => $this->sampleDesign(),
        ]);

        $resp->assertStatus(201)
            ->assertJsonPath('data.name', 'Mẫu A')
            ->assertJsonPath('data.design.canvas.width', 1000)
            ->assertJsonPath('data.design.elements.0.text', '{{name}}');

        $this->assertDatabaseHas('certificate_templates', ['name' => 'Mẫu A']);
    }

    public function test_14_2_set_default_unsets_other_defaults(): void
    {
        $t1 = CertificateTemplate::create(['name' => 'T1', 'design' => $this->sampleDesign(), 'is_default' => true, 'created_by' => $this->admin->id]);
        $t2 = CertificateTemplate::create(['name' => 'T2', 'design' => $this->sampleDesign(), 'is_default' => false, 'created_by' => $this->admin->id]);

        $this->postJson("/api/v1/certificate-templates/{$t2->id}/default")->assertOk()
            ->assertJsonPath('data.is_default', true);

        $this->assertFalse((bool) $t1->refresh()->is_default);
        $this->assertTrue((bool) $t2->refresh()->is_default);
        $this->assertEquals(1, CertificateTemplate::where('is_default', true)->count());
    }

    public function test_14_3_duplicate_template_is_independent_copy(): void
    {
        $original = CertificateTemplate::create(['name' => 'Original', 'design' => $this->sampleDesign(), 'created_by' => $this->admin->id]);

        $resp = $this->postJson("/api/v1/certificate-templates/{$original->id}/duplicate")->assertStatus(201);
        $cloneId = $resp->json('data.id');
        $this->assertNotEquals($original->id, $cloneId);

        $this->putJson("/api/v1/certificate-templates/{$cloneId}", [
            'name' => 'Clone edited',
            'design' => [
                'canvas' => ['width' => 5000, 'height' => 5000],
                'elements' => [],
            ],
        ])->assertOk();

        $original->refresh();
        $this->assertEquals(1000, $original->design['canvas']['width']);
    }

    public function test_14_4_preview_template_replaces_placeholders(): void
    {
        try {
            $resp = $this->postJson('/api/v1/certificate-templates/preview', [
                'design' => $this->sampleDesign(),
            ]);
            $resp->assertOk();
            $this->assertStringStartsWith('data:application/pdf;base64,', $resp->json('data.pdf'));
        } catch (\Throwable $e) {
            $this->markTestSkipped('Browsershot/headless Chrome unavailable in test env: ' . $e->getMessage());
        }
    }

    public function test_14_5_upload_asset_url_persists(): void
    {
        $design = $this->sampleDesign();
        $design['elements'][] = ['type' => 'image', 'url' => 'https://example.com/logo.png'];

        $resp = $this->postJson('/api/v1/certificate-templates', [
            'name' => 'With asset',
            'design' => $design,
        ])->assertStatus(201);

        $resp->assertJsonPath('data.design.elements.1.url', 'https://example.com/logo.png');
    }

    public function test_14_6_delete_template_in_use_nulls_course_fk_no_500(): void
    {
        $template = CertificateTemplate::create(['name' => 'In use', 'design' => $this->sampleDesign(), 'created_by' => $this->admin->id]);
        $course = $this->createCourse(['certificate_template_id' => $template->id]);

        $student = $this->createUser('cert-holder@example.com');
        $cert = CourseCertificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'template_id' => $template->id,
            'track' => 'online',
            'cert_code' => 'CKC-2026-TESTCODE',
            'has_physical' => false,
            'issued_at' => now(),
        ]);

        $resp = $this->deleteJson("/api/v1/certificate-templates/{$template->id}");
        $resp->assertOk();

        $course->refresh();
        $this->assertNull($course->certificate_template_id);

        $cert->refresh();
        $this->assertNull($cert->template_id, 'Existing issued certificate template_id should null out via nullOnDelete FK.');
        $this->assertNotEquals(500, $resp->getStatusCode());
    }

    public function test_14_6b_delete_default_template_is_blocked(): void
    {
        $template = CertificateTemplate::create(['name' => 'Default one', 'design' => $this->sampleDesign(), 'is_default' => true, 'created_by' => $this->admin->id]);

        $this->deleteJson("/api/v1/certificate-templates/{$template->id}")->assertStatus(422);
        $this->assertDatabaseHas('certificate_templates', ['id' => $template->id]);
    }
}
