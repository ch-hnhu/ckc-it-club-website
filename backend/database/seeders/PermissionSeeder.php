<?php

namespace Database\Seeders;

use App\Enums\PermissionsEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Tất cả permissions của hệ thống kèm mô tả tiếng Việt.
     */
    private array $definitions = [
        'admin_panel.access' => 'Truy cập trang quản trị',
        'dashboard.view' => 'Xem dashboard tổng quan',
        'users.view' => 'Xem danh sách và chi tiết người dùng',
        'users.create' => 'Thêm người dùng mới',
        'users.update' => 'Cập nhật thông tin người dùng',
        'users.delete' => 'Xóa người dùng',
        'roles.view' => 'Xem danh sách vai trò',
        'roles.manage' => 'Thêm, sửa, xóa vai trò và gán quyền',
        'permissions.view' => 'Xem danh sách quyền hạn',
        'permissions.manage' => 'Gán và thu hồi vai trò trên quyền hạn',
        'club_info.view' => 'Xem thông tin CLB',
        'club_info.manage' => 'Thêm, sửa, xóa thông tin CLB',
        'contacts.view' => 'Xem liên hệ và thống kê',
        'contacts.manage' => 'Cập nhật trạng thái liên hệ',
        'applications.view' => 'Xem đơn xét tuyển',
        'applications.manage' => 'Cập nhật trạng thái đơn xét tuyển',
        'application_questions.view' => 'Xem câu hỏi xét tuyển',
        'application_questions.manage' => 'Thêm, sửa, xóa, sắp xếp câu hỏi xét tuyển',
        'academic_structure.import' => 'Import cơ cấu học thuật',
        'academic_data.view' => 'Xem dữ liệu khoa, ngành, lớp',
        'community.view' => 'Truy cập khu vực quản lý cộng đồng',
        'community.channels.manage' => 'Thêm, sửa, xóa kênh thảo luận',
        'community.posts.view' => 'Xem danh sách bài đăng cộng đồng',
        'community.posts.manage' => 'Ẩn, ghim, xóa bài đăng cộng đồng',
        'community.blogs.view' => 'Xem danh sách blog',
        'community.blogs.manage' => 'Tạo, sửa, xuất bản, xóa blog',
        'community.resources.view' => 'Xem danh sách tài nguyên chia sẻ',
        'community.resources.manage' => 'Duyệt, từ chối, xóa tài nguyên chia sẻ',
        'community.comments.view' => 'Xem danh sách bình luận',
        'community.comments.manage' => 'Ẩn, xóa bình luận vi phạm',
        'community.tags.manage' => 'Thêm, sửa, xóa tags',
        'community.notifications.send' => 'Gửi thông báo hàng loạt đến người dùng',
        'community.chat.view' => 'Xem danh sách phòng chat và nhật ký sự kiện',
        'community.chat.manage' => 'Xóa sự kiện hệ thống trong phòng chat',
        'community.media.view' => 'Xem và quản lý tài nguyên media cộng đồng',
        'community.skills.manage' => 'Thêm, sửa, xóa, bật/tắt skills của thành viên',
        'community.reports.view' => 'Xem và xử lý báo cáo vi phạm từ cộng đồng',
        'mail_templates.view' => 'Xem danh sách loại mail và template',
        'mail_templates.manage' => 'Thêm, sửa, xóa, đặt mặc định mail template; bật/tắt auto-send',
        'courses.view' => 'Xem danh sách và chi tiết khóa học',
        'courses.manage' => 'Tạo, sửa, xóa, đổi trạng thái khóa học và nội dung buổi học',
        'quizzes.manage' => 'Tạo và chỉnh sửa quiz cho buổi học',
        'events.view' => 'Xem danh sách và chi tiết sự kiện',
        'events.manage' => 'Tạo, sửa, xóa, đổi trạng thái sự kiện',
        'events.check_in' => 'Thực hiện điểm danh sự kiện',
        'gamification.view' => 'Xem luật điểm, rank và bảng xếp hạng',
        'gamification.manage' => 'Thêm, sửa, xóa luật điểm và rank',
    ];

    /**
     * Ma trận phân quyền: role name (string) → danh sách permissions được gán.
     */
    private array $matrix = [
        // Quản trị viên — toàn quyền
        'admin' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.manage',
            'permissions.view', 'permissions.manage',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
            'community.view',
            'community.channels.manage',
            'community.posts.view', 'community.posts.manage',
            'community.blogs.view', 'community.blogs.manage',
            'community.resources.view', 'community.resources.manage',
            'community.comments.view', 'community.comments.manage',
            'community.tags.manage',
            'community.notifications.send',
            'community.chat.view', 'community.chat.manage',
            'community.media.view',
            'community.skills.manage',
            'community.reports.view',
            'mail_templates.view', 'mail_templates.manage',
            'courses.view', 'courses.manage', 'quizzes.manage',
            'events.view', 'events.manage', 'events.check_in',
            'gamification.view', 'gamification.manage',
        ],

        // Chủ nhiệm — full chức năng, chỉ xem/cập nhật người dùng (không tạo/xóa/phân quyền)
        'president' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.update',
            'roles.view',
            'permissions.view',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
            'community.view',
            'community.channels.manage',
            'community.posts.view', 'community.posts.manage',
            'community.blogs.view', 'community.blogs.manage',
            'community.resources.view', 'community.resources.manage',
            'community.comments.view', 'community.comments.manage',
            'community.tags.manage',
            'community.notifications.send',
            'community.chat.view', 'community.chat.manage',
            'community.media.view',
            'community.skills.manage',
            'community.reports.view',
            'mail_templates.view', 'mail_templates.manage',
            'courses.view', 'courses.manage', 'quizzes.manage',
            'events.view', 'events.manage', 'events.check_in',
            'gamification.view', 'gamification.manage',
        ],

        // Phó Chủ nhiệm — full chức năng, chỉ xem/cập nhật người dùng (không tạo/xóa/phân quyền)
        'vice-president' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.update',
            'roles.view',
            'permissions.view',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
            'community.view',
            'community.channels.manage',
            'community.posts.view', 'community.posts.manage',
            'community.blogs.view', 'community.blogs.manage',
            'community.resources.view', 'community.resources.manage',
            'community.comments.view', 'community.comments.manage',
            'community.tags.manage',
            'community.notifications.send',
            'community.chat.view', 'community.chat.manage',
            'community.media.view',
            'community.skills.manage',
            'community.reports.view',
            'mail_templates.view', 'mail_templates.manage',
            'courses.view', 'courses.manage', 'quizzes.manage',
            'events.view', 'events.manage', 'events.check_in',
            'gamification.view', 'gamification.manage',
        ],

        // Trưởng ban Học thuật — quản lý Khoá học (danh mục, buổi học, học viên,
        // chứng nhận, mẫu chứng nhận) và quản lý sự kiện; xem thống kê
        'academic-head' => [
            'admin_panel.access',
            'dashboard.view',
            'courses.view', 'courses.manage', 'quizzes.manage',
            'events.view', 'events.manage', 'events.check_in',
        ],

        // Trưởng ban Truyền thông — quản lý cộng đồng (báo cáo vi phạm, skills,
        // phòng chat, tags, bình luận, blogs, posts, kênh) và quản lý sự kiện
        // (người tham gia, thư viện ảnh, phản hồi); xem thống kê
        'communications-head' => [
            'admin_panel.access',
            'dashboard.view',
            'community.view',
            'community.channels.manage',
            'community.posts.view', 'community.posts.manage',
            'community.blogs.view', 'community.blogs.manage',
            'community.comments.view', 'community.comments.manage',
            'community.tags.manage',
            'community.chat.view', 'community.chat.manage',
            'community.media.view',
            'community.skills.manage',
            'community.reports.view',
            'events.view', 'events.manage', 'events.check_in',
        ],

        // Trưởng ban Tình nguyện — quản lý đơn vị (khoa, ngành, lớp, import),
        // ứng tuyển CLB (form, yêu cầu tham gia, mail template) và liên hệ; xem thống kê
        'volunteer-head' => [
            'admin_panel.access',
            'dashboard.view',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
            'mail_templates.view', 'mail_templates.manage',
        ],
    ];

    public function run(): void
    {
        // 1. Tạo tất cả permissions (idempotent — chạy lại không bị lỗi duplicate)
        foreach ($this->definitions as $name => $description) {
            Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['description' => $description]
            );
        }

        // 2. Gán permissions cho từng role theo ma trận
        foreach ($this->matrix as $roleName => $permNames) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->syncPermissions($permNames);
            }
        }

        // 3. Xóa Spatie permission cache để thay đổi có hiệu lực ngay
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('✓ Permissions seeded and assigned to roles successfully.');
    }
}
