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
        'admin_panel.access'           => 'Truy cập trang quản trị',
        'dashboard.view'               => 'Xem dashboard tổng quan',
        'users.view'                   => 'Xem danh sách và chi tiết người dùng',
        'users.create'                 => 'Thêm người dùng mới',
        'users.update'                 => 'Cập nhật thông tin người dùng',
        'users.delete'                 => 'Xóa người dùng',
        'roles.view'                   => 'Xem danh sách vai trò',
        'roles.manage'                 => 'Thêm, sửa, xóa vai trò và gán quyền',
        'permissions.view'             => 'Xem danh sách quyền hạn',
        'club_info.view'               => 'Xem thông tin CLB',
        'club_info.manage'             => 'Thêm, sửa, xóa thông tin CLB',
        'contacts.view'                => 'Xem liên hệ và thống kê',
        'contacts.manage'              => 'Cập nhật trạng thái liên hệ',
        'applications.view'            => 'Xem đơn xét tuyển',
        'applications.manage'          => 'Cập nhật trạng thái đơn xét tuyển',
        'application_questions.view'   => 'Xem câu hỏi xét tuyển',
        'application_questions.manage' => 'Thêm, sửa, xóa, sắp xếp câu hỏi xét tuyển',
        'academic_structure.import'    => 'Import cơ cấu học thuật',
        'academic_data.view'           => 'Xem dữ liệu khoa, ngành, lớp',
    ];

    /**
     * Ma trận phân quyền: role name (string) → danh sách permissions được gán.
     * Dùng string key vì PHP không cho phép enum case làm key trong property declaration.
     */
    private array $matrix = [
        // Quản trị viên — toàn quyền
        'admin' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.manage',
            'permissions.view',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
        ],

        // Chủ nhiệm — hầu hết, không quản lý roles/permissions hệ thống
        'president' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.create', 'users.update',
            'roles.view',
            'permissions.view',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
        ],

        // Phó Chủ nhiệm — quản lý vận hành, không quản lý phân quyền
        'vice-president' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view', 'users.create', 'users.update',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'applications.view', 'applications.manage',
            'application_questions.view',
            'academic_structure.import',
            'academic_data.view',
        ],

        // Trưởng ban Học thuật — quản lý xét tuyển và cơ cấu học thuật
        'academic-head' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view',
            'applications.view', 'applications.manage',
            'application_questions.view', 'application_questions.manage',
            'academic_structure.import',
            'academic_data.view',
        ],

        // Trưởng ban Truyền thông — quản lý thông tin CLB và liên hệ
        'communications-head' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view',
            'club_info.view', 'club_info.manage',
            'contacts.view', 'contacts.manage',
            'academic_data.view',
        ],

        // Trưởng ban Tình nguyện — quản lý đơn xét tuyển
        'volunteer-head' => [
            'admin_panel.access',
            'dashboard.view',
            'users.view',
            'applications.view', 'applications.manage',
            'academic_data.view',
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
