<?php

namespace Database\Seeders;

use App\Enums\CourseLevel;
use App\Enums\CourseStatus;
use App\Enums\CourseAudience;
use App\Enums\TagModelType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LearningCenterSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = DB::table('users')->where('email', 'admin@gmail.com')->value('id');

        if (! $adminId) {
            return;
        }

        $multipleChoiceId = DB::table('question_types')
            ->where('key', 'multiple_choice')
            ->value('id');

        if (! $multipleChoiceId) {
            $this->command->warn('QuestionTypeSeeder chưa chạy — bỏ qua LearningCenterSeeder.');
            return;
        }

        $tagMap = $this->seedCourseTags($adminId);
        $courseId = $this->seedCourse($adminId, $this->pickTags($tagMap, ['HTML & CSS', 'JavaScript', 'Web Development']));

        $this->seedLessons($courseId, $adminId, $multipleChoiceId);

        $this->seedDemoCourses($adminId, $tagMap, $multipleChoiceId);
    }

    // ── Tags ────────────────────────────────────────────────────────────────

    /**
     * Seed bộ category khoá học, trả về map name => id để các khoá chọn tag theo tên.
     *
     * @return array<string,int>
     */
    private function seedCourseTags(int $adminId): array
    {
        $tags = [
            ['name' => 'HTML & CSS', 'description' => 'Ngôn ngữ đánh dấu và định dạng trang web.'],
            ['name' => 'JavaScript', 'description' => 'Ngôn ngữ lập trình phía client.'],
            ['name' => 'Web Development', 'description' => 'Phát triển ứng dụng web.'],
            ['name' => 'Frontend', 'description' => 'Lập trình giao diện người dùng.'],
            ['name' => 'Backend', 'description' => 'Lập trình phía máy chủ và API.'],
            ['name' => 'Python', 'description' => 'Ngôn ngữ lập trình Python.'],
            ['name' => 'React', 'description' => 'Thư viện xây dựng giao diện React.'],
            ['name' => 'TypeScript', 'description' => 'JavaScript có kiểu tĩnh.'],
            ['name' => 'UI/UX', 'description' => 'Thiết kế trải nghiệm và giao diện.'],
            ['name' => 'Công cụ', 'description' => 'Công cụ lập trình: Git, terminal...'],
            ['name' => 'Kỹ năng mềm', 'description' => 'Kỹ năng nghề nghiệp và làm việc nhóm.'],
        ];

        $map = [];
        foreach ($tags as $tag) {
            $slug = Str::slug($tag['name']);
            DB::table('tags')->updateOrInsert(
                ['model_type' => TagModelType::COURSE->value, 'slug' => $slug],
                [
                    'model_type' => TagModelType::COURSE->value,
                    'name' => $tag['name'],
                    'slug' => $slug,
                    'description' => $tag['description'],
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            $map[$tag['name']] = DB::table('tags')
                ->where('model_type', TagModelType::COURSE->value)
                ->where('slug', $slug)
                ->value('id');
        }

        return $map;
    }

    /**
     * Lấy id của các tag theo tên từ map.
     *
     * @param  array<string,int>  $tagMap
     * @param  string[]  $names
     * @return int[]
     */
    private function pickTags(array $tagMap, array $names): array
    {
        return array_values(array_filter(array_map(fn (string $n) => $tagMap[$n] ?? null, $names)));
    }

    // ── Course ───────────────────────────────────────────────────────────────

    private function seedCourse(int $adminId, array $tagIds): int
    {
        $slug = 'lap-trinh-web-co-ban';

        if (DB::table('courses')->where('slug', $slug)->exists()) {
            return DB::table('courses')->where('slug', $slug)->value('id');
        }

        $courseId = DB::table('courses')->insertGetId([
            'title' => 'Lập trình Web Cơ Bản',
            'slug' => $slug,
            'description' => 'Khoá học nhập môn lập trình web dành cho thành viên CLB IT CKC. '
                .'Từ HTML, CSS đến JavaScript và Responsive Design — 6 buổi học thực hành, 1 buổi tổng kết.',
            'thumbnail' => 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=70',
            'level' => CourseLevel::BEGINNER->value,
            'status' => CourseStatus::PUBLISHED->value,
            'max_offline_slots' => null,
            'max_absent_allowed' => null,
            'created_by' => $adminId,
            'updated_by' => $adminId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (array_filter($tagIds) as $tagId) {
            DB::table('course_tags')->insertOrIgnore([
                'course_id' => $courseId,
                'tag_id' => $tagId,
            ]);
        }

        return $courseId;
    }

    // ── Lessons ──────────────────────────────────────────────────────────────

    private function seedLessons(int $courseId, int $adminId, int $typeId): void
    {
        $lessons = $this->getLessonsData();

        foreach ($lessons as $order => $data) {
            $slug = Str::slug($data['title']);

            if (DB::table('lessons')->where('course_id', $courseId)->where('slug', $slug)->exists()) {
                continue;
            }

            $lessonId = DB::table('lessons')->insertGetId([
                'course_id' => $courseId,
                'title' => $data['title'],
                'slug' => $slug,
                'description' => $data['description'],
                'order' => $order + 1,
                'status' => CourseStatus::PUBLISHED->value,
                'resource_url' => $data['resource_url'],
                'video_url' => $data['video_url'],
                'video_duration' => $data['video_duration'],
                'document' => $data['document'],
                'assignment_url' => $data['assignment_url'],
                'assignment_deadline' => $data['assignment_deadline'],
                'created_by' => $adminId,
                'updated_by' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $quizId = DB::table('quizzes')->insertGetId([
                'lesson_id' => $lessonId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($data['questions'] as $qOrder => $q) {
                $questionId = DB::table('quiz_questions')->insertGetId([
                    'quiz_id' => $quizId,
                    'question_type_id' => $typeId,
                    'content' => $q['content'],
                    'image' => null,
                    'order' => $qOrder + 1,
                    'metadata' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($q['options'] as $optOrder => $opt) {
                    DB::table('quiz_question_options')->insert([
                        'question_id' => $questionId,
                        'content' => $opt['content'],
                        'image' => null,
                        'is_correct' => $opt['is_correct'],
                        'order' => $optOrder + 1,
                        'metadata' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    // ── Khoá demo (nhẹ) ───────────────────────────────────────────────────────

    /**
     * Seed thêm các khoá demo phủ đủ trạng thái vòng đời (đang nhận đăng ký,
     * đã đóng đăng ký + có bài, sắp mở, đã kết thúc) và nhiều category để test bộ lọc.
     *
     * @param  array<string,int>  $tagMap
     */
    private function seedDemoCourses(int $adminId, array $tagMap, int $typeId): void
    {
        $now = now();
        $userIds = DB::table('users')->orderBy('id')->pluck('id')->all();

        $courses = [
            [
                'slug' => 'python-nhap-mon',
                'title' => 'Python Nhập Môn',
                'description' => 'Làm quen ngôn ngữ Python qua các ví dụ thực tế: biến, điều kiện, vòng lặp và hàm. Khoá nền tảng cho người mới bắt đầu lập trình.',
                'thumbnail' => 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::BEGINNER->value,
                'audience' => CourseAudience::PUBLIC ->value,
                'tags' => ['Python', 'Kỹ năng mềm'],
                // Đang nhận đăng ký → nút "Đăng ký"
                'enrollment_start' => $now->copy()->subDays(5),
                'enrollment_deadline' => $now->copy()->addDays(10),
                'course_end' => $now->copy()->addDays(45),
                'max_offline_slots' => 30,
                'lessons' => ['Cài đặt & Biến', 'Câu lệnh điều kiện', 'Vòng lặp', 'Hàm & Module'],
                'enroll' => 12,
            ],
            [
                'slug' => 'react-cho-nguoi-moi',
                'title' => 'React cho Người Mới',
                'description' => 'Xây dựng ứng dụng web tương tác với React: component, props, state và hooks. Thực hành qua một dự án nhỏ xuyên suốt khoá học.',
                'thumbnail' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::INTERMEDIATE->value,
                'audience' => CourseAudience::CAO_THANG_STUDENT->value,
                'tags' => ['React', 'Frontend', 'JavaScript'],
                // Đã đóng đăng ký + đang diễn ra → nút "Bắt đầu học"
                'enrollment_start' => $now->copy()->subDays(30),
                'enrollment_deadline' => $now->copy()->subDays(10),
                'course_end' => $now->copy()->addDays(20),
                'max_offline_slots' => 25,
                'lessons' => ['JSX & Component', 'Props & State', 'Hooks cơ bản', 'Gọi API & Render danh sách'],
                'enroll' => 18,
            ],
            [
                'slug' => 'java-huong-doi-tuong',
                'title' => 'Lập trình Hướng Đối Tượng với Java',
                'description' => 'Tư duy lập trình hướng đối tượng: lớp, đối tượng, kế thừa, đa hình và đóng gói thông qua ngôn ngữ Java.',
                'thumbnail' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::INTERMEDIATE->value,
                'audience' => CourseAudience::CAO_THANG_STUDENT->value,
                'tags' => ['Backend'],
                // Sắp mở đăng ký, chưa có bài học → nút "Quan tâm"
                'enrollment_start' => $now->copy()->addDays(7),
                'enrollment_deadline' => $now->copy()->addDays(21),
                'course_end' => null,
                'max_offline_slots' => 40,
                'lessons' => [], // chưa có bài học
                'enroll' => 3,
            ],
            [
                'slug' => 'ui-ux-design-can-ban',
                'title' => 'UI/UX Design Căn Bản',
                'description' => 'Nguyên tắc thiết kế giao diện và trải nghiệm người dùng: layout, màu sắc, typography và cách dựng prototype bằng Figma.',
                'thumbnail' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::BEGINNER->value,
                'audience' => CourseAudience::CAO_THANG_STUDENT->value,
                'tags' => ['UI/UX'],
                // Đã kết thúc → kho tự học
                'enrollment_start' => $now->copy()->subDays(60),
                'enrollment_deadline' => $now->copy()->subDays(40),
                'course_end' => $now->copy()->subDays(5),
                'max_offline_slots' => null,
                'lessons' => ['Nguyên tắc thị giác', 'Màu sắc & Typography', 'Dựng prototype với Figma'],
                'enroll' => 9,
            ],
            [
                'slug' => 'git-github-teamwork',
                'title' => 'Git & GitHub cho Teamwork',
                'description' => 'Quản lý mã nguồn chuyên nghiệp: commit, branch, merge, pull request và quy trình cộng tác nhóm trên GitHub.',
                'thumbnail' => 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::BEGINNER->value,
                'audience' => CourseAudience::CAO_THANG_STUDENT->value,
                'tags' => ['Công cụ'],
                // Đang nhận đăng ký → nút "Đăng ký"
                'enrollment_start' => $now->copy()->subDays(2),
                'enrollment_deadline' => $now->copy()->addDays(14),
                'course_end' => $now->copy()->addDays(40),
                'max_offline_slots' => 35,
                'lessons' => ['Git cơ bản', 'Branch & Merge', 'Pull Request & Cộng tác'],
                'enroll' => 15,
            ],
            [
                'slug' => 'typescript-thuc-chien',
                'title' => 'TypeScript Thực Chiến',
                'description' => 'Viết JavaScript an toàn hơn với TypeScript: kiểu dữ liệu, interface, generic và tích hợp vào dự án React thực tế.',
                'thumbnail' => 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=70',
                'level' => CourseLevel::ADVANCED->value,
                'audience' => CourseAudience::CAO_THANG_STUDENT->value,
                'tags' => ['TypeScript', 'Frontend'],
                // Đã đóng đăng ký + đang diễn ra → nút "Bắt đầu học"
                'enrollment_start' => $now->copy()->subDays(25),
                'enrollment_deadline' => $now->copy()->subDays(8),
                'course_end' => $now->copy()->addDays(25),
                'max_offline_slots' => 20,
                'lessons' => ['Kiểu dữ liệu & Interface', 'Generic', 'TypeScript với React', 'Cấu hình dự án'],
                'enroll' => 7,
            ],
        ];

        foreach ($courses as $c) {
            if (DB::table('courses')->where('slug', $c['slug'])->exists()) {
                continue;
            }

            $courseId = DB::table('courses')->insertGetId([
                'title' => $c['title'],
                'slug' => $c['slug'],
                'description' => $c['description'],
                'thumbnail' => $c['thumbnail'],
                'level' => $c['level'],
                'audience' => $c['audience'],
                'status' => CourseStatus::PUBLISHED->value,
                'enrollment_start' => $c['enrollment_start'],
                'enrollment_deadline' => $c['enrollment_deadline'],
                'course_end' => $c['course_end'],
                'max_offline_slots' => $c['max_offline_slots'],
                'max_absent_allowed' => $c['max_offline_slots'] !== null ? 3 : null,
                'created_by' => $adminId,
                'updated_by' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($this->pickTags($tagMap, $c['tags']) as $tagId) {
                DB::table('course_tags')->insertOrIgnore([
                    'course_id' => $courseId,
                    'tag_id' => $tagId,
                ]);
            }

            $hasOffline = $c['max_offline_slots'] !== null;

            foreach ($c['lessons'] as $i => $topic) {
                // Thời lượng thật của video bài giảng rfscVS0vtbw (4h26m52s)
                // để khớp với thời lượng player hiển thị khi xem.
                $duration = 16012;

                // Lịch offline: buổi 1 bắt đầu ngay sau khi đóng đăng ký, mỗi buổi cách nhau 1 tuần.
                // Chỉ set khi khoá có mở lớp offline — khoá online-only không có lịch.
                $sessionStart = $hasOffline
                    ? $c['enrollment_deadline']->copy()->addDays($i * 7)->setTime(18, 0)
                    : null;
                $sessionEnd = $sessionStart?->copy()->addHours(2);

                $this->createSimpleLesson(
                    $courseId,
                    $i + 1,
                    $topic,
                    $duration,
                    $adminId,
                    $typeId,
                    $sessionStart,
                    $sessionEnd,
                );
            }

            $this->seedEnrollments($courseId, $userIds, $c['enroll']);
        }
    }

    /**
     * Tạo một buổi học gọn (video + tài nguyên + bài tập + quiz 2 câu) cho khoá demo.
     * $sessionStart/$sessionEnd chỉ truyền khi khoá có mở lớp offline (max_offline_slots != null).
     */
    private function createSimpleLesson(
        int $courseId,
        int $order,
        string $topic,
        int $duration,
        int $adminId,
        int $typeId,
        ?\Illuminate\Support\Carbon $sessionStart = null,
        ?\Illuminate\Support\Carbon $sessionEnd = null,
    ): void {
        $slug = Str::slug("buoi-{$order}-{$topic}");

        if (DB::table('lessons')->where('course_id', $courseId)->where('slug', $slug)->exists()) {
            return;
        }

        $lessonId = DB::table('lessons')->insertGetId([
            'course_id' => $courseId,
            'title' => "Buổi {$order}: {$topic}",
            'slug' => $slug,
            'description' => "Nội dung buổi học: {$topic}.",
            'order' => $order,
            'status' => CourseStatus::PUBLISHED->value,
            'session_start' => $sessionStart,
            'session_end' => $sessionEnd,
            'resource_url' => 'https://developer.mozilla.org/vi/docs/Learn',
            'video_url' => 'https://www.youtube.com/embed/rfscVS0vtbw',
            'video_duration' => $duration,
            // Buổi lẻ có thêm bản ghi livestream để demo 2 tab; buổi chẵn chỉ có video bài giảng (ẩn tab)
            'live_url' => $order % 2 === 1 ? 'https://www.youtube.com/embed/_uQrJ0TkZlc' : null,
            // Thời lượng thật của video _uQrJ0TkZlc (6h14m7s)
            'live_duration' => $order % 2 === 1 ? 22447 : null,
            'document' => "## {$topic}\n\nNội dung lý thuyết của buổi học sẽ được cập nhật tại đây. Bao gồm khái niệm chính, ví dụ minh hoạ và bài thực hành.",
            'assignment_url' => 'https://forms.gle/placeholder-'.$slug,
            'assignment_deadline' => now()->addDays($order * 7),
            'created_by' => $adminId,
            'updated_by' => $adminId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $quizId = DB::table('quizzes')->insertGetId([
            'lesson_id' => $lessonId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $questions = [
            [
                'content' => "Đâu là phát biểu đúng về \"{$topic}\"?",
                'options' => [
                    ['content' => 'Phát biểu đúng về chủ đề này', 'is_correct' => true],
                    ['content' => 'Phát biểu sai thứ nhất', 'is_correct' => false],
                    ['content' => 'Phát biểu sai thứ hai', 'is_correct' => false],
                    ['content' => 'Phát biểu sai thứ ba', 'is_correct' => false],
                ],
            ],
            [
                'content' => "Mục tiêu chính khi học \"{$topic}\" là gì?",
                'options' => [
                    ['content' => 'Nắm vững và vận dụng được kiến thức', 'is_correct' => true],
                    ['content' => 'Chỉ học thuộc lòng', 'is_correct' => false],
                    ['content' => 'Bỏ qua phần thực hành', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $qOrder => $q) {
            $questionId = DB::table('quiz_questions')->insertGetId([
                'quiz_id' => $quizId,
                'question_type_id' => $typeId,
                'content' => $q['content'],
                'image' => null,
                'order' => $qOrder + 1,
                'metadata' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($q['options'] as $optOrder => $opt) {
                DB::table('quiz_question_options')->insert([
                    'question_id' => $questionId,
                    'content' => $opt['content'],
                    'image' => null,
                    'is_correct' => $opt['is_correct'],
                    'order' => $optOrder + 1,
                    'metadata' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Ghi danh $count user đầu tiên vào khoá để enrolled_count khác 0 (demo).
     *
     * @param  int[]  $userIds
     */
    private function seedEnrollments(int $courseId, array $userIds, int $count): void
    {
        foreach (array_slice($userIds, 0, $count) as $i => $userId) {
            DB::table('course_enrollments')->insertOrIgnore([
                'user_id' => $userId,
                'course_id' => $courseId,
                // Xen kẽ offline/online cho đa dạng
                'track' => $i % 3 === 0 ? 'offline' : 'online',
                'progress' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // ── Data ─────────────────────────────────────────────────────────────────

    private function getLessonsData(): array
    {
        return [
            // Buổi 1
            [
                'title' => 'Buổi 1: Giới thiệu HTML & Cấu trúc trang web',
                'description' => 'Làm quen với HTML — ngôn ngữ đánh dấu siêu văn bản, cách trình duyệt đọc và hiển thị nội dung.',
                'resource_url' => 'https://developer.mozilla.org/vi/docs/Learn/HTML/Introduction_to_HTML',
                'video_url' => 'https://www.youtube.com/embed/qz0aGYrrlhU',
                'video_duration' => 4174,
                'assignment_url' => 'https://forms.gle/AQw1sWuiTtBrPRuC9',
                'assignment_deadline' => now()->addDays(7),
                'document' => <<<'MD'
## HTML là gì?

**HTML** (HyperText Markup Language) là ngôn ngữ đánh dấu tiêu chuẩn để xây dựng trang web. HTML mô tả **cấu trúc** của trang bằng các thẻ (tags).

## Cấu trúc tài liệu HTML

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>Trang web đầu tiên</title>
  </head>
  <body>
    <h1>Xin chào thế giới!</h1>
    <p>Đây là đoạn văn đầu tiên.</p>
  </body>
</html>
```

## Các thẻ HTML phổ biến

| Thẻ | Ý nghĩa |
|---|---|
| `<h1>` – `<h6>` | Tiêu đề cấp 1–6 |
| `<p>` | Đoạn văn |
| `<a href="">` | Liên kết |
| `<img src="">` | Hình ảnh |
| `<ul>`, `<ol>`, `<li>` | Danh sách |
| `<div>`, `<span>` | Container bố cục |

## Thực hành

Tạo file `index.html` và viết trang giới thiệu bản thân gồm: tiêu đề, đoạn mô tả, danh sách kỹ năng và một liên kết đến GitHub của bạn.
MD,
                'questions' => [
                    [
                        'content' => 'HTML là viết tắt của từ gì?',
                        'options' => [
                            ['content' => 'HyperText Markup Language', 'is_correct' => true],
                            ['content' => 'HighText Machine Language', 'is_correct' => false],
                            ['content' => 'HyperTransfer Markup Language', 'is_correct' => false],
                            ['content' => 'HyperText Making Language', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Thẻ nào dùng để tạo liên kết trong HTML?',
                        'options' => [
                            ['content' => '<a>', 'is_correct' => true],
                            ['content' => '<link>', 'is_correct' => false],
                            ['content' => '<href>', 'is_correct' => false],
                            ['content' => '<url>', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Thẻ tiêu đề lớn nhất trong HTML là thẻ nào?',
                        'options' => [
                            ['content' => '<h1>', 'is_correct' => true],
                            ['content' => '<h6>', 'is_correct' => false],
                            ['content' => '<header>', 'is_correct' => false],
                            ['content' => '<title>', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Khai báo `<!DOCTYPE html>` có tác dụng gì?',
                        'options' => [
                            ['content' => 'Khai báo tài liệu sử dụng HTML5', 'is_correct' => true],
                            ['content' => 'Đặt tiêu đề cho trang web', 'is_correct' => false],
                            ['content' => 'Nhúng file CSS vào trang', 'is_correct' => false],
                            ['content' => 'Tạo phần tử DOCTYPE cho CSS', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            // Buổi 2
            [
                'title' => 'Buổi 2: CSS & Định dạng giao diện',
                'description' => 'Học cách sử dụng CSS để tạo kiểu cho trang web — màu sắc, font chữ, khoảng cách và bố cục cơ bản.',
                'resource_url' => 'https://developer.mozilla.org/vi/docs/Learn/CSS/First_steps',
                'video_url' => 'https://www.youtube.com/embed/1PnVor36_40',
                'video_duration' => 1424,
                'assignment_url' => 'https://forms.gle/awUUKMydHyiFas2E6',
                'assignment_deadline' => now()->addDays(14),
                'document' => <<<'MD'
## CSS là gì?

**CSS** (Cascading Style Sheets) điều khiển **giao diện** của trang HTML — màu sắc, font, kích thước và bố cục.

## 3 cách thêm CSS

```html
<!-- 1. Inline -->
<p style="color: red;">Đỏ</p>

<!-- 2. Internal (trong <head>) -->
<style>p { color: blue; }</style>

<!-- 3. External (khuyến nghị) -->
<link rel="stylesheet" href="style.css" />
```

## Box Model

Mọi phần tử HTML đều là một hộp gồm 4 lớp: **content → padding → border → margin**.

## Selector thông dụng

```css
p      { color: gray; }        /* Thẻ */
.card  { border-radius: 8px; } /* Class */
#logo  { width: 120px; }       /* ID */
```

## Thực hành

Tạo file `style.css` và trang trí trang giới thiệu bản thân từ buổi 1: thêm màu nền, căn chỉnh văn bản và định dạng danh sách kỹ năng dạng thẻ (badge).
MD,
                'questions' => [
                    [
                        'content' => 'CSS là viết tắt của từ gì?',
                        'options' => [
                            ['content' => 'Cascading Style Sheets', 'is_correct' => true],
                            ['content' => 'Creative Style System', 'is_correct' => false],
                            ['content' => 'Computer Style Sheets', 'is_correct' => false],
                            ['content' => 'Colorful Style Sheets', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Thuộc tính CSS nào dùng để thay đổi màu chữ?',
                        'options' => [
                            ['content' => 'color', 'is_correct' => true],
                            ['content' => 'text-color', 'is_correct' => false],
                            ['content' => 'font-color', 'is_correct' => false],
                            ['content' => 'foreground', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Selector nào có độ ưu tiên (specificity) cao nhất trong CSS?',
                        'options' => [
                            ['content' => 'Inline style (style="...")', 'is_correct' => true],
                            ['content' => 'ID selector (#id)', 'is_correct' => false],
                            ['content' => 'Class selector (.class)', 'is_correct' => false],
                            ['content' => 'Tag selector (p, div)', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            // Buổi 3
            [
                'title' => 'Buổi 3: JavaScript Cơ Bản',
                'description' => 'Làm quen với JavaScript — biến, kiểu dữ liệu, hàm và câu lệnh điều kiện.',
                'resource_url' => 'https://javascript.info/first-steps',
                'video_url' => 'https://www.youtube.com/embed/W6NZfCO5SIk',
                'video_duration' => 2897,
                'assignment_url' => 'https://forms.gle/placeholder-buoi-3',
                'assignment_deadline' => now()->addDays(21),
                'document' => <<<'MD'
## JavaScript là gì?

**JavaScript** là ngôn ngữ lập trình cho phép tạo nội dung động — phản hồi người dùng, cập nhật dữ liệu mà không cần tải lại trang.

## Biến & Kiểu dữ liệu

```js
let ten    = 'An';     // string
const tuoi = 20;       // number
var active = true;     // boolean

console.log(typeof ten); // "string"
```

## Hàm

```js
function chao(ten) {
    return `Xin chào, ${ten}!`;
}

const binhPhuong = (n) => n * n;

console.log(chao('An'));    // Xin chào, An!
console.log(binhPhuong(5)); // 25
```

## Câu lệnh điều kiện

```js
const diem = 85;

if (diem >= 90) {
    console.log('Xuất sắc');
} else if (diem >= 70) {
    console.log('Khá');
} else {
    console.log('Trung bình');
}
```

## Thực hành

Viết hàm JavaScript kiểm tra một số có phải số nguyên tố không, rồi in ra tất cả số nguyên tố từ 1 đến 100.
MD,
                'questions' => [
                    [
                        'content' => 'Từ khoá nào dùng để khai báo hằng số trong JavaScript?',
                        'options' => [
                            ['content' => 'const', 'is_correct' => true],
                            ['content' => 'let', 'is_correct' => false],
                            ['content' => 'var', 'is_correct' => false],
                            ['content' => 'fixed', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Kết quả của `typeof "hello"` là gì?',
                        'options' => [
                            ['content' => '"string"', 'is_correct' => true],
                            ['content' => '"text"', 'is_correct' => false],
                            ['content' => '"char"', 'is_correct' => false],
                            ['content' => '"object"', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Cú pháp nào là arrow function hợp lệ?',
                        'options' => [
                            ['content' => 'const f = (x) => x * 2', 'is_correct' => true],
                            ['content' => 'function f => (x) { x * 2 }', 'is_correct' => false],
                            ['content' => 'const f = function => x * 2', 'is_correct' => false],
                            ['content' => 'arrow f(x) { return x * 2 }', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            // Buổi 4
            [
                'title' => 'Buổi 4: DOM & Xử lý sự kiện',
                'description' => 'Học cách dùng JavaScript để thao tác với phần tử HTML (DOM) và phản hồi sự kiện từ người dùng.',
                'resource_url' => 'https://javascript.info/document',
                'video_url' => 'https://www.youtube.com/embed/0ik6X4DJKCc',
                'video_duration' => 2341,
                'assignment_url' => 'https://forms.gle/placeholder-buoi-4',
                'assignment_deadline' => now()->addDays(28),
                'document' => <<<'MD'
## DOM là gì?

**DOM** (Document Object Model) là cấu trúc dạng cây mà trình duyệt xây dựng từ HTML. JavaScript có thể đọc và thay đổi DOM để cập nhật giao diện theo thời gian thực.

## Chọn phần tử

```js
const btn     = document.getElementById('myBtn');
const cards   = document.querySelectorAll('.card');
const heading = document.querySelector('h1');
```

## Thay đổi nội dung & kiểu

```js
heading.textContent = 'Tiêu đề mới';
heading.style.color = 'red';
btn.classList.add('active');
```

## Lắng nghe sự kiện

```js
btn.addEventListener('click', () => {
    alert('Bạn đã bấm nút!');
});

document.addEventListener('keydown', (e) => {
    console.log('Phím:', e.key);
});
```

## Thực hành

Xây dựng ứng dụng **To-do list** đơn giản: thêm việc cần làm, đánh dấu hoàn thành và xoá từng mục.
MD,
                'questions' => [
                    [
                        'content' => 'DOM là viết tắt của từ gì?',
                        'options' => [
                            ['content' => 'Document Object Model', 'is_correct' => true],
                            ['content' => 'Data Object Management', 'is_correct' => false],
                            ['content' => 'Dynamic Object Model', 'is_correct' => false],
                            ['content' => 'Document Output Model', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Phương thức nào trả về phần tử đầu tiên khớp với CSS selector?',
                        'options' => [
                            ['content' => 'document.querySelector()', 'is_correct' => true],
                            ['content' => 'document.getElementById()', 'is_correct' => false],
                            ['content' => 'document.querySelectorAll()', 'is_correct' => false],
                            ['content' => 'document.getElement()', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Phương thức nào dùng để lắng nghe sự kiện trên một phần tử?',
                        'options' => [
                            ['content' => 'addEventListener()', 'is_correct' => true],
                            ['content' => 'onEvent()', 'is_correct' => false],
                            ['content' => 'listenEvent()', 'is_correct' => false],
                            ['content' => 'bindEvent()', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Thuộc tính nào dùng để đọc/ghi nội dung văn bản thuần của phần tử?',
                        'options' => [
                            ['content' => 'textContent', 'is_correct' => true],
                            ['content' => 'innerHTML', 'is_correct' => false],
                            ['content' => 'innerText', 'is_correct' => false],
                            ['content' => 'nodeValue', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            // Buổi 5
            [
                'title' => 'Buổi 5: Responsive Design & Bootstrap',
                'description' => 'Xây dựng giao diện thích ứng với mọi kích thước màn hình bằng Flexbox, Grid và Bootstrap.',
                'resource_url' => 'https://getbootstrap.com/docs/5.3/getting-started/introduction/',
                'video_url' => 'https://www.youtube.com/embed/4sosXZsdy-s',
                'video_duration' => 4728,
                'assignment_url' => 'https://forms.gle/placeholder-buoi-5',
                'assignment_deadline' => now()->addDays(35),
                'document' => <<<'MD'
## Responsive Design là gì?

**Responsive Design** là kỹ thuật thiết kế giao diện tự điều chỉnh để hiển thị đẹp trên mọi thiết bị — từ điện thoại đến màn hình lớn.

## CSS Flexbox

```css
.container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}
```

## CSS Grid

```css
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
```

## Media Queries

```css
.card { width: 300px; }

@media (max-width: 768px) {
    .card { width: 100%; }
}
```

## Bootstrap Grid

```html
<div class="container">
    <div class="row">
        <div class="col-md-4">Cột 1</div>
        <div class="col-md-4">Cột 2</div>
        <div class="col-md-4">Cột 3</div>
    </div>
</div>
```

## Thực hành

Chuyển đổi trang cá nhân từ buổi 1–2 thành responsive bằng Bootstrap: navbar, grid kỹ năng và footer đầy đủ.
MD,
                'questions' => [
                    [
                        'content' => 'Thuộc tính CSS nào kích hoạt Flexbox?',
                        'options' => [
                            ['content' => 'display: flex', 'is_correct' => true],
                            ['content' => 'layout: flex', 'is_correct' => false],
                            ['content' => 'position: flex', 'is_correct' => false],
                            ['content' => 'flex: enable', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Trong Bootstrap 5, class nào tạo bố cục 2 cột bằng nhau trên màn hình md?',
                        'options' => [
                            ['content' => 'col-md-6', 'is_correct' => true],
                            ['content' => 'col-md-2', 'is_correct' => false],
                            ['content' => 'col-2', 'is_correct' => false],
                            ['content' => 'col-md-half', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Media query nào áp dụng khi màn hình rộng tối đa 768px?',
                        'options' => [
                            ['content' => '@media (max-width: 768px)', 'is_correct' => true],
                            ['content' => '@media (min-width: 768px)', 'is_correct' => false],
                            ['content' => '@screen max(768px)', 'is_correct' => false],
                            ['content' => '@responsive (768px)', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            // Buổi 6
            [
                'title' => 'Buổi 6: Đồ Án Cuối Khoá',
                'description' => 'Tổng hợp toàn bộ kiến thức để xây dựng hoàn chỉnh một trang Portfolio cá nhân responsive.',
                'resource_url' => 'https://github.com/topics/portfolio-template',
                'video_url' => 'https://www.youtube.com/embed/oYRda7UtuhA',
                'video_duration' => 4319,
                'assignment_url' => 'https://forms.gle/placeholder-buoi-6-doan',
                'assignment_deadline' => now()->addDays(42),
                'document' => <<<'MD'
## Đồ án cuối khoá — Trang Portfolio Cá Nhân

Áp dụng **toàn bộ kiến thức** HTML, CSS, JavaScript và Bootstrap để xây dựng trang portfolio cá nhân hoàn chỉnh.

## Yêu cầu tối thiểu

**Bố cục:**
- Navbar responsive (hamburger menu trên mobile)
- Hero section với ảnh và giới thiệu ngắn
- Section kỹ năng dạng grid
- Section dự án (tối thiểu 2 project)
- Footer với liên kết mạng xã hội

**JavaScript:**
- Smooth scroll khi bấm menu
- Hiệu ứng xuất hiện khi cuộn trang
- Form liên hệ có validation cơ bản

**Responsive:** đẹp trên cả mobile (≤ 768px) và desktop (≥ 1024px).

## Tiêu chí chấm điểm

| Tiêu chí | Điểm |
|---|---|
| Cấu trúc HTML semantic | 20 |
| CSS / Bootstrap — đẹp, responsive | 30 |
| JavaScript hoạt động đúng | 30 |
| Tính hoàn thiện & sáng tạo | 20 |

## Nộp bài

Nộp **link GitHub repository** (source code) và **link GitHub Pages** (live preview) qua form bên dưới.
MD,
                'questions' => [
                    [
                        'content' => 'Thẻ HTML semantic nào dùng để định nghĩa phần điều hướng?',
                        'options' => [
                            ['content' => '<nav>', 'is_correct' => true],
                            ['content' => '<div class="nav">', 'is_correct' => false],
                            ['content' => '<menu>', 'is_correct' => false],
                            ['content' => '<navigation>', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Thuộc tính CSS nào tạo khoảng cách bên trong phần tử (giữa content và border)?',
                        'options' => [
                            ['content' => 'padding', 'is_correct' => true],
                            ['content' => 'margin', 'is_correct' => false],
                            ['content' => 'spacing', 'is_correct' => false],
                            ['content' => 'gap', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Sự kiện JavaScript nào xảy ra khi người dùng cuộn trang?',
                        'options' => [
                            ['content' => 'scroll', 'is_correct' => true],
                            ['content' => 'wheel', 'is_correct' => false],
                            ['content' => 'move', 'is_correct' => false],
                            ['content' => 'slide', 'is_correct' => false],
                        ],
                    ],
                    [
                        'content' => 'Lệnh Git nào dùng để đẩy code lên GitHub lần đầu tiên?',
                        'options' => [
                            ['content' => 'git push -u origin main', 'is_correct' => true],
                            ['content' => 'git upload origin main', 'is_correct' => false],
                            ['content' => 'git send origin main', 'is_correct' => false],
                            ['content' => 'git publish main', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }
}
