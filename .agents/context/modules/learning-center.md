# Learning Center Module (Trung tâm đào tạo / Khoá học)

## Purpose of this document
Self-contained reference for the Learning Center feature so an AI agent in a fresh session (including for **test design/execution**) can understand entities, rules, permissions, APIs, workflows, and where the code lives — without re-reading the whole codebase. Cross-check against `.agents/context/backend.md`, `frontend-admin.md`, `frontend-user.md` for broader project conventions; this file is the focused module view.

## Mental model (read this first)
One course (`Course`) supports **two parallel learning tracks** — `offline` and `online` — chosen by the learner at enrollment. There is **no separate "offline course" vs "online course" record**. A `Lesson` (buổi học) is a container holding everything: video, live URL, markdown document, assignment link, and quiz. Track only changes **what counts toward completion**, not what content exists. Track is fixed at enrollment time and never changes (architectural decision — see `CourseEnrollmentService` doc comment): changing track would let one user earn two certificates for one course, which is unwanted (`course_certificates` is unique per `user_id + course_id + track`).

- **Offline**: QR/manual attendance per lesson + assignment graded by hand + quiz ≥ threshold → counts toward a **paper-backed** certificate (`has_physical`).
- **Online**: video watched ≥ 80% + quiz ≥ threshold (no assignment requirement) → fully automatic **PDF** certificate, no admin involvement.
- Quiz is the same content for both tracks and is the main anti-cheat gate; video-watch tracking is intentionally lightweight (client-reported %, trusted).

## Entities

All models live in `backend/app/Models/`. All learning tables use Eloquent (no separate "module" namespace).

| Model | Table | Key fields | Notes |
|---|---|---|---|
| `Course` | `courses` | `title`, `slug` (unique), `level` (`beginner/intermediate/advanced`), `status` (`draft/published`), `audience` (`club_member/cao_thang_student/public`), `enrollment_start`, `enrollment_deadline`, `course_end`, `max_offline_slots` (null = online-only course), `max_absent_allowed` (null = unlimited), `quiz_pass_threshold` (default 80), `certificate_template_id` | Soft-deletes. `audience=public` still requires login, just no role/email check. |
| `Lesson` | `lessons` | `course_id`, `order`, `status`, `session_start`/`session_end` (offline schedule + QR validity window), `resource_url`, `video_url` + `video_duration`, `live_url` + `live_duration` (YouTube live fallback when official video not uploaded yet), `document` (markdown), `assignment_url` (Google Forms) + `assignment_deadline` | Soft-deletes. Unique `(course_id, slug)`. `playableVideoUrl()` = `video_url ?: live_url`. |
| `CourseEnrollment` | `course_enrollments` | `user_id`, `course_id`, `track` (`offline/online`, **immutable**), `progress` (0–100), `completed_at` | Unique `(user_id, course_id)`. `progress`/`completed_at` recomputed by `CourseCompletionService`. |
| `LessonProgress` | `lesson_progress` | `user_id`, `lesson_id`, `section_type` (`video/assignment/quiz`), `is_completed`, `score` (assignment/quiz only), `watch_percentage` (video only), `completed_at` | Unique `(user_id, lesson_id, section_type)`. One row per section per learner. Completion is **sticky**: once `is_completed=true` it never flips back (best score/percentage kept). |
| `LessonAttendance` | `lesson_attendances` | `user_id`, `lesson_id`, `type` (`qr/manual`), `note`, `attended_at`, `recorded_by` | Unique `(user_id, lesson_id)`. The actual "present" record for offline. |
| `LessonQrTicket` | `lesson_qr_tickets` | `user_id`, `lesson_id`, `token` (HMAC-SHA256 of `lessonId:userId:timestamp`), `used_at` | Unique `(user_id, lesson_id)`. Just an intent-to-attend ticket; `used_at` set when admin scans it via check-in. Distinct from `LessonAttendance` (a ticket can exist unused; attendance can exist without a ticket via manual toggle). |
| `Quiz` | `quizzes` | `lesson_id` (unique — 1 quiz per lesson), `is_published` | |
| `QuizQuestion` | `quiz_questions` | `quiz_id`, `question_type_id` (FK `question_types`), `content`, `explanation`, `image`, `order`, `metadata` (json) | |
| `QuizQuestionOption` | `quiz_question_options` | `question_id`, `content`, `image`, `is_correct`, `order`, `metadata` (json) | `metadata` shape depends on question type (see Quiz grading below). |
| `QuizAttempt` | `quiz_attempts` | `user_id`, `quiz_id`, `score` (0–100), `is_passed`, `started_at`, `finished_at`, `is_review` (true = taken after course already completed; doesn't affect progress/cert) | One row **per submission** (history kept, not deduped). |
| `QuizAttemptAnswer` | `quiz_attempt_answers` | `attempt_id`, `question_id`, `answer_data` (json), `is_correct` | |
| `CertificateTemplate` | `certificate_templates` | `name`, `design` (json canvas scene: `{canvas:{width,height,background},elements:[...]}`), `html_content` (legacy fallback), `thumbnail`, `is_default`, `created_by` | Canva-style drag/drop editor output. `render()` does `{{key}}` replacement for the legacy HTML path. |
| `CourseCertificate` | `course_certificates` | `user_id`, `course_id`, `template_id` (nullOnDelete), `track`, `cert_code` (unique, format `CKC-{year}-{8 random upper}`), `cert_url` (PDF on public disk), `has_physical`, `issued_at`, `revoked_at`, `revoked_by` | Unique `(user_id, course_id, track)` — **one cert per user per course per track**, ever. Revoke keeps the row (sets `revoked_at`); reissue regenerates PDF + cert_code on the same row. |
| `CourseFollower` | `course_followers` | `user_id`, `course_id` | "Interested in" toggle, unrelated to enrollment. |
| Course categories | `tags` (`model_type = course`) | — | Categories are just `Tag` rows scoped by `TagModelType::COURSE`; no dedicated category table. |

## Business rules

### Enrollment (`App\Services\CourseEnrollmentService`)
- Audience gate (`Course.audience`) is checked **every time**, not just at enrollment — an existing enrollment never bypasses a later audience change (covered by `LearningAudienceAccessTest`):
  - `club_member` → user has any role other than the base `user` role.
  - `cao_thang_student` → email matches `^\d{10}@caothang\.edu\.vn$` (`User::isSchoolStudent()`).
  - `public` → any authenticated user (no anonymous access).
- Explicit enroll (`POST .../enroll`): course must be `published`; user must not already be enrolled (422 if so); track-specific window:
  - `offline`: requires `max_offline_slots !== null` (else course doesn't open offline), `enrollment_start ≤ now ≤ enrollment_deadline`, and a free slot (`enrollments.where(track=offline).count() < max_offline_slots`, locked with `lockForUpdate()` inside a transaction to avoid overbooking races).
  - `online`: only blocked if `course_end` has passed.
- **Implicit enroll** (`ensureEnrolledOnline`): triggered the moment a guest-turned-learner watches a video or submits a quiz with no enrollment yet. Always creates an `online` enrollment, **ignores all time windows** (you can keep progressing after `course_end`), still enforces audience.
- Removing an enrollment (`remove()`) cascades deletes of that user's `LessonProgress` and `LessonAttendance` rows for the course, but **never deletes issued certificates** (kept as proof of completion).

### Lesson/content access gates
- Lesson detail is always readable once published (so the frontend can show a "this lesson hasn't started" panel), but **video and quiz endpoints 403 if `lesson.session_start` is in the future**.
- **Sequential lock** (`lockedLessonIds()` in `User\CourseController`, mirrored in frontend): 
  - Fully-online course (`max_offline_slots === null`): only the first not-yet-100%-complete lesson is open; everything after it is locked.
  - Course with an offline track: any lesson already complete, already started (`session_start ≤ now`), or the single nearest upcoming lesson is open; other future lessons are locked.
  - This is enforced **server-side** too (`lesson()`/`video()` 403 with "Buổi học này đang bị khoá...") — not just a UI nicety.

### Lesson progress % (per-lesson, display only)
Differs by track — **assignment only counts for offline, video only counts for online**, quiz counts for both:
- offline: `(assignment_done + quiz_done) / (has_assignment + has_quiz)`
- online: `(video_done + quiz_done) / (has_video + has_quiz)`
- no enrollment yet: counts video + assignment + quiz all together.

### Course completion (`App\Services\CourseCompletionService::recalc`)
Called after every progress-affecting action (video %, quiz submit, attendance toggle, assignment grading). Only considers `published` lessons with a `published` quiz.
- **Online**: for every lesson, video-watched (if it has a video) and quiz-passed (if it has a quiz) are summed as fractions; `progress = done/total * 100`; `completed` when `done === total`.
- **Offline**: only evaluated **after every scheduled session has occurred** (`session_end < now` for all lessons that have a schedule) — completion can never trigger early. Then: `absent = scheduled_lessons - attended`, must be `≤ max_absent_allowed` (null = unlimited); every lesson with an assignment must be graded `passed`; every lesson with a quiz must be passed. `progress` is a weighted average of (attendance + assignment + quiz) counts.
- Completion is **sticky**: `completed_at` is set once and never cleared by a later recalc (e.g. if an admin un-grades an assignment afterward). Revoking is a deliberate separate action (certificate revoke), not automatic.
- The instant an enrollment transitions to completed (`justCompleted`), two side effects fire exactly once: `CourseCertificateService::issue()` and a `learning_center.course_completed` point award.

### Quiz grading (`App\Services\QuizGradingService`) — server is the source of truth
Client receives `is_correct` per option up front (Duolingo-style immediate feedback), but **score is always recomputed server-side on submit**, never trusted from the client. `score = correct_count/total * 100`; `is_passed = score >= course.quiz_pass_threshold`. Per question-type `answer_data` contract:

| Type | `answer_data` shape | Grading rule |
|---|---|---|
| `multiple_choice` / `multiple_select` | `{selected: [option_id,...]}` | Selected ID set must exactly equal the `is_correct=true` ID set. |
| `fill_blank` | `{text: "..."}` | Case-insensitive, whitespace-normalized match against any correct option's content. |
| `word_bank_fill_blank` | `{slots: [option_id, ...]}` | Slot `i` must hold the option whose `metadata.slot_index === i`. |
| `word_order` | `{order: [option_id, ...]}` | Sequence must match correct options sorted by `metadata.slot_index`. |
| `matching` | `{pairs: [[left_id, right_id], ...]}` | Every pair's `metadata.pairId` must match and sides must be `left`/`right` respectively. |

Quiz progress (`LessonProgress.section_type=quiz`) completion is sticky on first pass; best score is kept across attempts. Every attempt is recorded in `quiz_attempts`/`quiz_attempt_answers` regardless of pass/fail (full history, no overwrite).

### Certificates (`App\Services\CourseCertificateService` + `CertificateRenderer`)
- `issue()` is idempotent on `(user_id, course_id, track)`: if a non-revoked cert already exists, it's returned as-is (no PDF regenerated). Falls back through `course.certificateTemplate → default template → any template`; returns `null` if literally no template exists in the system yet.
- Render path: if `template.design.canvas` is set → WYSIWYG render via Browsershot (headless Chrome) replaying the Konva canvas scene with real data (`CertificateRenderer`); else → legacy `{{placeholder}}` string-replace + DomPDF. Supported placeholders: `name`, `course`, `cert_code`, `issued_at`, `track` (label "Offline"/"Online"), `verify_url` (`{APP_URL}/verify/{cert_code}` — **note: no `/verify/{code}` page exists yet, frontend or backend; the QR/link currently points nowhere**).
- `revoke()` only sets `revoked_at`/`revoked_by` — file and row are kept as history.
- `reissue()` regenerates `cert_code` + PDF on the **same row** (no new row, since the unique key is per user+course+track) and clears `revoked_at`.

### Gamification hooks (`App\Services\PointService`, rule keys under `learning_center.*`)
Awarded once per source row (de-duplicated by `point_rule_id + source_type + source_id`), seeded in `PointRuleSeeder`:
| Rule key | Points | Fires when |
|---|---|---|
| `learning_center.video_completed` | 5 | Video watch % first crosses 80% |
| `learning_center.quiz_passed` | 10 | Quiz first passes threshold |
| `learning_center.assignment_completed` | 10 | Admin first grades an assignment as passed |
| `learning_center.course_completed` | 50 | Enrollment first transitions to completed |

## Permissions

Defined in `backend/app/Enums` + `PermissionSeeder.php`, enforced as Laravel route middleware (`permission:<key>`), not policies.

| Permission | Grants | Held by |
|---|---|---|
| `courses.view` | Read: course/lesson/enrollment/certificate-template lists & detail, admin lesson detail | `admin`, `president`, `vice-president`, `academic-head` |
| `courses.manage` | Write: course CRUD + trash/restore, lesson CRUD, attendance check-in/toggle, grading, enrollment (admin-side enroll/remove), certificate revoke/reissue, certificate-template CRUD/default/duplicate/assets/preview, course-category CRUD | same 4 roles |
| `quizzes.manage` | Quiz show/upsert/destroy for a lesson (kept as its **own** permission, separate from `courses.manage`, so quiz-authoring access can be granted/restricted independently) | same 4 roles |

No role currently has `courses.view`/`manage` without also having the other two (i.e. in practice it's all-or-nothing per role), but the gates are independent in code — don't assume `courses.manage` implies `quizzes.manage` when writing tests. `communications-head` / `volunteer-head` explicitly do **not** get any Learning Center permission.

Student-facing routes have no permission gate — they're public-read, with `auth:sanctum` only where a user identity is required (enroll, follow, progress, certificate, quiz submit). Audience checks (`club_member`/`cao_thang_student`/`public`) are a **separate, per-course** business rule, not a Spatie permission.

## APIs

Base: `/api/v1`. Defined in `backend/routes/api.php`.

### User-facing (`/learning/...`, public read + auth-optional, listed in `App\Http\Controllers\Api\V1\User`)
| Method | Path | Controller@action | Auth |
|---|---|---|---|
| GET | `/learning/courses` | `CourseController@index` | optional (shows own progress if logged in) |
| GET | `/learning/categories` | `CourseController@categories` | none |
| GET | `/learning/courses/{course:slug}` | `CourseController@show` | optional |
| GET | `/learning/courses/{course:slug}/lessons/{lessonSlug}` | `CourseController@lesson` | optional, audience-gated |
| GET | `/learning/courses/{course:slug}/lessons/{lessonSlug}/quiz` | `QuizController@show` | optional, audience-gated |
| GET | `/learning/courses/{course:slug}/lessons/{lessonSlug}/videos/{videoSlug}` | `CourseController@video` | optional, audience-gated, session-start-gated |
| POST | `/learning/courses/{course:slug}/enroll` | `CourseController@enroll` | required |
| POST | `/learning/courses/{course:slug}/follow` | `CourseController@toggleFollow` | required |
| POST | `/learning/courses/{course:slug}/lessons/{lessonSlug}/qr-ticket` | `CourseController@createQrTicket` | required, offline-track only |
| POST | `/learning/courses/{course:slug}/lessons/{lessonSlug}/progress` | `CourseController@markVideoProgress` | required |
| GET | `/learning/courses/{course:slug}/certificate` | `CourseController@certificate` | required |
| POST | `/learning/courses/{course:slug}/lessons/{lessonSlug}/quiz/submit` | `QuizController@submit` | required (registered outside the `learning` prefix group but same path) |

### Admin (`/courses`, `/course-categories`, `/certificate-templates`, under `App\Http\Controllers\Api\V1\Admin`)
| Method | Path | Controller@action | Permission |
|---|---|---|---|
| GET | `courses`, `courses/trash`, `courses/{course}` | `CourseController` | `courses.view` |
| GET | `course-categories` | `CourseCategoryController@index` | `courses.view` |
| GET | `certificate-templates`, `certificate-templates/{id}` | `CertificateTemplateController` | `courses.view` |
| GET | `courses/{course}/lessons/{lesson}` | `LessonController@show` | `courses.view` |
| POST/PUT/PATCH/DELETE | `courses`, `courses/{course}` | `CourseController` (store/update/destroy) | `courses.manage` |
| PATCH/DELETE | `courses/trash/{id}/restore`, `courses/trash/{id}/force` | `CourseController` | `courses.manage` |
| POST/PUT/PATCH/DELETE | `course-categories[/{tag}]` | `CourseCategoryController` | `courses.manage` |
| GET | `lessons/youtube-duration` | `LessonController@youtubeDuration` | `courses.manage` |
| POST/PUT/PATCH/DELETE | `courses/{course}/lessons[/{lesson}]` | `LessonController` | `courses.manage` |
| POST | `courses/{course}/lessons/{lesson}/check-in` | `LessonController@checkIn` | `courses.manage` |
| POST | `courses/{course}/lessons/{lesson}/attendance` | `LessonController@toggleAttendance` | `courses.manage` |
| GET/PUT | `courses/{course}/lessons/{lesson}/grades` | `LessonController@grades`/`saveGrades` | `courses.manage` |
| GET | `courses/{course}/enrollable-users` | `CourseController@searchEnrollableUsers` | `courses.manage` |
| POST/DELETE | `courses/{course}/enrollments[/{enrollment}]` | `CourseController@enrollStudent`/`removeEnrollment` | `courses.manage` |
| POST | `courses/{course}/certificates/{certificate}/revoke`,`/reissue` | `CourseController` | `courses.manage` |
| POST/PUT/DELETE | `certificate-templates[/{id}]`, `/assets`, `/preview`, `/default`, `/duplicate` | `CertificateTemplateController` | `courses.manage` |
| GET/PUT/DELETE | `courses/{course}/lessons/{lesson}/quiz` | `QuizController@show`/`upsert`/`destroy` | `quizzes.manage` |

## Workflows

### Student: self-paced online learning
1. Browse `/khoa-hoc` (catalog, filter by category/level/audience) → open a course detail page.
2. If audience doesn't match (and not already enrolled) → see ineligibility notice, can't open lessons.
3. Open first/next-incomplete lesson → watch video. Client reports watch % periodically (YouTube IFrame API + manual mark); server keeps the best % seen and auto-enrolls the user as `online` if they had no enrollment yet.
4. At ≥80% watched, video section completes → 5 XP, course progress recalculated.
5. Take the quiz (same UI either guest or logged-in; only logged-in submissions persist). Submit → server regrades, records attempt, updates sticky quiz progress. Passing → 10 XP.
6. Once every lesson's video+quiz are done → enrollment flips to completed → certificate auto-issued (PDF) + 50 XP bonus.
7. Certificate retrievable via `GET .../certificate`.

### Student: offline-track learning
1. Enroll explicitly choosing `track=offline` during the enrollment window, subject to slot limit.
2. Per lesson: register intent to attend → get a QR ticket; show QR at the session; admin scans it (`check-in`) which creates `LessonAttendance` and marks the ticket used. Admin can also toggle attendance manually if the scanner fails.
3. Submit the assignment externally (Google Forms link) — completion is **not automatic**; admin grades pass/fail per lesson later (`grades`/`saveGrades`).
4. Take the quiz exactly as online learners do.
5. Completion only evaluates once every scheduled session's `session_end` has passed: absences within `max_absent_allowed`, all assignments passed, all quizzes passed → certificate (with `has_physical` flag) + 50 XP.

### Admin: building a course
1. Create course (`courses.manage`): title, level, audience, `status=draft`, optionally check "Mở lớp offline" to set `max_offline_slots`/`max_absent_allowed`/enrollment window/`course_end` (unchecking nulls all of these server-side, even if the client still sent values).
2. Add lessons in order (auto-incrementing `order`), set video URL (+ optional auto-fetched YouTube duration), live URL fallback, markdown document, assignment link+deadline, and for offline lessons `session_start`/`session_end`.
3. Build the quiz per lesson (`quizzes.manage`) — full replace semantics: every `PUT` deletes old questions (cascades options) and recreates from the submitted payload; must explicitly set `is_published=true` for the quiz to be visible/answerable.
4. Pick/duplicate/create a certificate template (canvas editor) and assign it on the course (falls back to the global default template if unset).
5. Flip `status=published` when ready.
6. Ongoing ops: manually enroll/remove students, check in/toggle attendance, grade assignments, revoke/reissue certificates as needed.

## Main files

### Backend (`backend/`)
- Models: `app/Models/{Course,Lesson,CourseEnrollment,LessonProgress,LessonAttendance,LessonQrTicket,Quiz,QuizQuestion,QuizQuestionOption,QuizAttempt,QuizAttemptAnswer,CertificateTemplate,CourseCertificate,CourseFollower}.php`
- Enums: `app/Enums/{CourseStatus,CourseAudience,CourseLevel,LessonSectionType,QuestionTypeKey}.php`
- Services (business logic lives here, not controllers): `app/Services/{CourseEnrollmentService,CourseCompletionService,CourseCertificateService,QuizGradingService,CertificateRenderer,PointService}.php`
- Controllers: `app/Http/Controllers/Api/V1/User/{CourseController,QuizController}.php`, `app/Http/Controllers/Api/V1/Admin/{CourseController,LessonController,QuizController,CertificateTemplateController,CourseCategoryController}.php`
- Routes: `routes/api.php` (`learning` prefix block ~line 171; admin `courses`/`certificate-templates` blocks ~line 534)
- Migrations: `database/migrations/2026_06_17_00000{2..6,9..13}_*`, `2026_06_18_00000{5..8}_*`, `2026_06_22_000001_create_course_followers_table.php`, `2026_03_25_152241_create_sessions_table.php` (unrelated `sessions` table, not lessons), `2026_06_28_000001_add_is_published_to_quizzes_table.php`
- Seeders: `database/seeders/{LearningCenterSeeder,PointRuleSeeder,PermissionSeeder}.php`
- Tests: `tests/Feature/LearningAudienceAccessTest.php` (the only existing automated coverage for this module)

### Frontend — user (`frontend/user/src/`)
- Pages: `pages/learning/{LearningFeedPage,CourseDetailPage,LessonDetailPage,VideoDetailPage,QuizPlayPage}.tsx` → routes `/khoa-hoc`, `/khoa-hoc/:slug`, `/khoa-hoc/:slug/:lessonSlug`, `/khoa-hoc/:slug/:lessonSlug/:videoSlug`, `/khoa-hoc/:slug/:lessonSlug/quiz`
- Component: `components/learning/CourseCard.tsx`
- Contract: `services/learning.service.ts`, `types/learning.types.ts`

### Frontend — admin (`frontend/admin/src/`)
- Pages: `pages/learning/{CourseListPage,CourseFormPage,CourseDetailPage,CourseTrashPage,CourseCategoryListPage,LessonFormPage,LessonDetailPage,QuizCreatePage,CertificateTemplateListPage,CertificateTemplateEditorPage,EnrollStudentDialog,LessonAttendanceDialog,LessonCheckInDialog,AssignmentGradeDialog}.tsx` + local types `course.types.ts`, `course-meta.ts`, `course-detail.types.ts`
- Routes: `/courses`, `/courses/create`, `/courses/:slug`, `/courses/:slug/edit`, `/courses/trash`, `/course-categories`, `/courses/:slug/lessons/create`, `/courses/:slug/lessons/:lessonId`, `/courses/:slug/lessons/:lessonId/edit`, `/learning/courses/:courseId/lessons/:lessonId/quiz/create`, `/certificate-templates`, `/certificate-templates/create`, `/certificate-templates/:id/edit`
- Services/types: `services/{course.service,course-category.service,certificate-template.service}.ts`, `types/certificate-template.type.ts`
- Sidebar group: "Trung tâm đào tạo" → Khóa học / Danh mục khóa học / Giấy chứng nhận (gated `courses.view`)

## Known gaps / things to watch when testing
- **No `/verify/{cert_code}` public page** (backend route or frontend route) — certificates embed a QR/link to it, but it 404s today. Don't write a test expecting it to resolve.
- Quiz question/option **image upload is not implemented** — only persisted if the client already has a real URL; `blob:`/`data:` previews are silently dropped on save.
- No API Resource classes for this module — controllers hand-build response arrays inline; if you change a model field, you must also update the relevant `transform*()` helper or the frontend contract silently breaks.
- `is_review` on `QuizAttempt` (retake after course completion) is stored but not yet surfaced/filterable anywhere in the read APIs.
- Admin routes are permission-gated but (per `backend.md` "Known Gaps") there's no broader role middleware audit beyond the specific `permission:` checks shown above — don't assume defense-in-depth beyond what's listed.
- `CourseCompletionService` offline evaluation requires **all scheduled sessions to be in the past** — a course with lessons that have no `session_end` at all (e.g. malformed data) will never auto-complete for offline learners; worth a test case.
