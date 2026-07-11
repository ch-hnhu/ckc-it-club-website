<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seed dữ liệu demo cho ProjectHub (kanban): board, cột, thẻ việc,
 * thành viên, người phụ trách và checklist việc con.
 */
class ProjectHubSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::whereIn('email', array_merge(
            ['admin@gmail.com', 'academichead@gmail.com', 'communicationshead@gmail.com', 'volunteerhead@gmail.com'],
            array_map(fn (int $i) => "student{$i}@gmail.com", range(1, 6)),
        ))->pluck('id', 'email');

        $admin = $users['admin@gmail.com'] ?? null;

        if (! $admin) {
            return;
        }

        $departments = DB::table('departments')->pluck('id', 'slug');
        $hackathonEventId = DB::table('events')->where('title', 'Cuộc thi Hackathon CKC 2026')->value('id');
        $webCourseId = DB::table('courses')->where('slug', 'lap-trinh-web-co-ban')->value('id');

        $boards = [
            [
                'name'          => 'Tổ chức Hackathon CKC 2026',
                'description'   => 'Điều phối toàn bộ công tác chuẩn bị và vận hành cuộc thi Hackathon CKC 2026: truyền thông, hậu cần, chuyên môn và tổng kết.',
                'color'         => '#7C3AED',
                'department_id' => $departments['hoc-thuat'] ?? null,
                'event_id'      => $hackathonEventId,
                'course_id'     => null,
                'members'       => [
                    'admin@gmail.com'              => 'owner',
                    'academichead@gmail.com'       => 'editor',
                    'communicationshead@gmail.com' => 'editor',
                    'student1@gmail.com'           => 'editor',
                    'student2@gmail.com'           => 'editor',
                    'student3@gmail.com'           => 'viewer',
                ],
                'columns' => [
                    [
                        'name'  => 'Cần làm',
                        'color' => '#94A3B8',
                        'tasks' => [
                            [
                                'title'       => 'Chốt danh sách giám khảo',
                                'description' => 'Liên hệ và xác nhận 3 giám khảo: 1 giảng viên khoa CNTT, 2 cựu sinh viên đang làm tại doanh nghiệp.',
                                'priority'    => 'high',
                                'due_offset'  => '+8 days',
                                'assignees'   => ['academichead@gmail.com'],
                                'checklist'   => [
                                    ['Gửi thư mời giảng viên khoa CNTT', false],
                                    ['Liên hệ cựu sinh viên FPT Software', false],
                                    ['Xác nhận lịch với cả 3 giám khảo', false],
                                ],
                            ],
                            [
                                'title'       => 'Chuẩn bị quà và giấy khen cho đội đạt giải',
                                'description' => 'Đặt in giấy khen, mua quà lưu niệm theo cơ cấu giải thưởng đã công bố.',
                                'priority'    => 'medium',
                                'due_offset'  => '+10 days',
                                'assignees'   => ['student3@gmail.com'],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Đang thực hiện',
                        'color' => '#3B82F6',
                        'tasks' => [
                            [
                                'title'       => 'Thiết kế bộ ấn phẩm truyền thông',
                                'description' => 'Banner fanpage, poster dán bảng tin và khung avatar cho thí sinh — theo nhận diện của cuộc thi.',
                                'priority'    => 'high',
                                'start_offset' => '-3 days',
                                'due_offset'  => '+4 days',
                                'assignees'   => ['communicationshead@gmail.com', 'student2@gmail.com'],
                                'checklist'   => [
                                    ['Banner fanpage 1200x630', true],
                                    ['Poster A3 dán bảng tin', true],
                                    ['Khung avatar cho thí sinh', false],
                                ],
                            ],
                            [
                                'title'       => 'Mở form đăng ký và theo dõi số đội',
                                'description' => 'Theo dõi số lượng đội đăng ký mỗi ngày, nhắc lịch đăng ký trên các kênh của CLB.',
                                'priority'    => 'urgent',
                                'start_offset' => '-5 days',
                                'due_offset'  => '+9 days',
                                'assignees'   => ['student1@gmail.com'],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Chờ duyệt',
                        'color' => '#F59E0B',
                        'tasks' => [
                            [
                                'title'       => 'Kịch bản MC ngày thi',
                                'description' => 'Kịch bản dẫn chương trình khai mạc, công bố đề và trao giải — chờ Chủ nhiệm duyệt.',
                                'priority'    => 'medium',
                                'due_offset'  => '+6 days',
                                'assignees'   => ['student2@gmail.com'],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Hoàn thành',
                        'color' => '#22C55E',
                        'tasks' => [
                            [
                                'title'       => 'Xin phòng và hội trường tổ chức',
                                'description' => 'Đã được nhà trường duyệt sử dụng Hội trường lớn trong 2 ngày thi.',
                                'priority'    => 'high',
                                'completed_offset' => '-4 days',
                                'assignees'   => ['academichead@gmail.com'],
                            ],
                            [
                                'title'       => 'Lập dự trù kinh phí',
                                'description' => 'Bảng dự trù kinh phí đã được duyệt: giải thưởng, in ấn, nước uống và hậu cần.',
                                'priority'    => 'medium',
                                'completed_offset' => '-7 days',
                                'assignees'   => ['admin@gmail.com'],
                                'checklist'   => [
                                    ['Tổng hợp chi phí giải thưởng', true],
                                    ['Chi phí in ấn + hậu cần', true],
                                    ['Trình Chủ nhiệm ký duyệt', true],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name'          => 'Phát triển Website CLB',
                'description'   => 'Kế hoạch phát triển và bảo trì website CLB IT CKC: tính năng mới, sửa lỗi và tối ưu trải nghiệm.',
                'color'         => '#0EA5E9',
                'department_id' => $departments['hoc-thuat'] ?? null,
                'event_id'      => null,
                'course_id'     => null,
                'members'       => [
                    'admin@gmail.com'        => 'owner',
                    'academichead@gmail.com' => 'editor',
                    'student1@gmail.com'     => 'editor',
                    'student4@gmail.com'     => 'editor',
                    'student5@gmail.com'     => 'editor',
                ],
                'columns' => [
                    [
                        'name'  => 'Backlog',
                        'color' => '#94A3B8',
                        'tasks' => [
                            [
                                'title'       => 'Nghiên cứu tích hợp thông báo đẩy (push notification)',
                                'description' => 'Khảo sát Web Push API và chi phí hạ tầng để nhắc thành viên về sự kiện sắp diễn ra.',
                                'priority'    => 'low',
                                'assignees'   => ['student4@gmail.com'],
                            ],
                            [
                                'title'       => 'Trang thống kê hoạt động cá nhân',
                                'description' => 'Dashboard cá nhân: số bài viết, sự kiện đã tham gia, tiến độ khóa học và điểm thưởng theo tháng.',
                                'priority'    => 'medium',
                                'assignees'   => [],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Đang làm',
                        'color' => '#3B82F6',
                        'wip_limit' => 3,
                        'tasks' => [
                            [
                                'title'       => 'Tối ưu tốc độ tải trang chủ',
                                'description' => 'Lazy-load ảnh, giảm kích thước bundle và bật cache API cho các khối nội dung tĩnh.',
                                'priority'    => 'high',
                                'start_offset' => '-2 days',
                                'due_offset'  => '+5 days',
                                'assignees'   => ['student1@gmail.com'],
                                'checklist'   => [
                                    ['Lazy-load ảnh thư viện sự kiện', true],
                                    ['Code-split các trang admin', false],
                                    ['Đo lại Lighthouse sau tối ưu', false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Code Review',
                        'color' => '#F59E0B',
                        'tasks' => [
                            [
                                'title'       => 'Sửa lỗi hiển thị lịch sự kiện trên mobile',
                                'description' => 'Lịch tháng bị tràn ngang trên màn hình nhỏ hơn 400px — PR đang chờ review.',
                                'priority'    => 'medium',
                                'due_offset'  => '+2 days',
                                'assignees'   => ['student5@gmail.com'],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Hoàn thành',
                        'color' => '#22C55E',
                        'tasks' => [
                            [
                                'title'       => 'Nâng cấp trang chứng chỉ khóa học',
                                'description' => 'Chứng chỉ PDF tự sinh kèm mã xác thực, đã triển khai lên production.',
                                'priority'    => 'high',
                                'completed_offset' => '-6 days',
                                'assignees'   => ['student1@gmail.com', 'student4@gmail.com'],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name'          => 'Vận hành khóa Lập trình Web Cơ Bản',
                'description'   => 'Theo dõi công việc vận hành khóa học: chuẩn bị bài giảng, chấm bài tập, điểm danh và cấp chứng chỉ.',
                'color'         => '#22C55E',
                'department_id' => $departments['hoc-thuat'] ?? null,
                'event_id'      => null,
                'course_id'     => $webCourseId,
                'members'       => [
                    'admin@gmail.com'        => 'owner',
                    'academichead@gmail.com' => 'editor',
                    'student1@gmail.com'     => 'editor',
                ],
                'columns' => [
                    [
                        'name'  => 'Cần làm',
                        'color' => '#94A3B8',
                        'tasks' => [
                            [
                                'title'       => 'Soạn đề quiz tổng kết cuối khóa',
                                'description' => 'Bộ 20 câu trắc nghiệm bao quát 6 buổi học, ngưỡng đạt 80%.',
                                'priority'    => 'medium',
                                'due_offset'  => '+7 days',
                                'assignees'   => ['academichead@gmail.com'],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Đang làm',
                        'color' => '#3B82F6',
                        'tasks' => [
                            [
                                'title'       => 'Chấm bài tập buổi 5 — Responsive Design',
                                'description' => 'Còn 8 bài nộp chưa chấm, hạn trả kết quả trước buổi học kế tiếp.',
                                'priority'    => 'high',
                                'start_offset' => '-1 days',
                                'due_offset'  => '+3 days',
                                'assignees'   => ['student1@gmail.com'],
                                'checklist'   => [
                                    ['Chấm 8 bài còn lại', false],
                                    ['Gửi nhận xét từng bài', false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'name'  => 'Hoàn thành',
                        'color' => '#22C55E',
                        'tasks' => [
                            [
                                'title'       => 'Chuẩn bị slide và video buổi 6 — JavaScript DOM',
                                'description' => 'Slide, video bài giảng và bài tập thực hành đã đăng lên khóa học.',
                                'priority'    => 'high',
                                'completed_offset' => '-2 days',
                                'assignees'   => ['academichead@gmail.com'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($boards as $boardData) {
            $slug = Str::slug($boardData['name']);

            if (DB::table('kanban_boards')->where('slug', $slug)->exists()) {
                continue;
            }

            $boardId = DB::table('kanban_boards')->insertGetId([
                'name'          => $boardData['name'],
                'slug'          => $slug,
                'description'   => $boardData['description'],
                'color'         => $boardData['color'],
                'department_id' => $boardData['department_id'],
                'course_id'     => $boardData['course_id'],
                'event_id'      => $boardData['event_id'],
                'is_archived'   => false,
                'created_by'    => $admin,
                'created_at'    => now()->subDays(10),
                'updated_at'    => now(),
            ]);

            foreach ($boardData['members'] as $email => $role) {
                $userId = $users[$email] ?? null;

                if (! $userId) {
                    continue;
                }

                DB::table('board_members')->insertOrIgnore([
                    'board_id'   => $boardId,
                    'user_id'    => $userId,
                    'role'       => $role,
                    'joined_at'  => now()->subDays(10),
                    'created_at' => now()->subDays(10),
                    'updated_at' => now(),
                ]);
            }

            foreach ($boardData['columns'] as $colPosition => $column) {
                $columnId = DB::table('board_columns')->insertGetId([
                    'board_id'   => $boardId,
                    'name'       => $column['name'],
                    'position'   => $colPosition,
                    'color'      => $column['color'] ?? null,
                    'wip_limit'  => $column['wip_limit'] ?? null,
                    'created_by' => $admin,
                    'created_at' => now()->subDays(10),
                    'updated_at' => now(),
                ]);

                foreach ($column['tasks'] as $taskPosition => $task) {
                    $taskId = DB::table('board_tasks')->insertGetId([
                        'board_id'     => $boardId,
                        'column_id'    => $columnId,
                        'title'        => $task['title'],
                        'description'  => $task['description'] ?? null,
                        'position'     => $taskPosition,
                        'priority'     => $task['priority'] ?? null,
                        'start_date'   => isset($task['start_offset']) ? now()->modify($task['start_offset'])->toDateString() : null,
                        'due_date'     => isset($task['due_offset']) ? now()->modify($task['due_offset'])->toDateString() : null,
                        'completed_at' => isset($task['completed_offset']) ? now()->modify($task['completed_offset']) : null,
                        'created_by'   => $admin,
                        'created_at'   => now()->subDays(9),
                        'updated_at'   => now(),
                    ]);

                    foreach ($task['assignees'] ?? [] as $email) {
                        $userId = $users[$email] ?? null;

                        if (! $userId) {
                            continue;
                        }

                        DB::table('board_task_assignees')->insertOrIgnore([
                            'task_id'     => $taskId,
                            'user_id'     => $userId,
                            'assigned_at' => now()->subDays(9),
                            'created_at'  => now()->subDays(9),
                            'updated_at'  => now(),
                        ]);
                    }

                    foreach ($task['checklist'] ?? [] as $itemPosition => [$content, $isDone]) {
                        DB::table('board_checklist_items')->insert([
                            'board_task_id' => $taskId,
                            'content'       => $content,
                            'is_done'       => $isDone,
                            'position'      => $itemPosition,
                            'created_at'    => now()->subDays(8),
                            'updated_at'    => now(),
                        ]);
                    }
                }
            }
        }
    }
}
