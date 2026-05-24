<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Danh sách ban kèm slug của role trưởng ban tương ứng.
     *
     * head_role: slug trong bảng roles được dùng làm head_role_id.
     *            Null nếu ban chưa có role trưởng ban riêng.
     */
    private array $departments = [
        [
            'name'        => 'Ban Học thuật',
            'slug'        => 'hoc-thuat',
            'description' => 'Phụ trách học liệu, workshop chuyên môn và hoạt động mentoring nội bộ.',
            'head_role'   => 'academic-head',
        ],
        [
            'name'        => 'Ban Truyền thông',
            'slug'        => 'truyen-thong',
            'description' => 'Phụ trách nội dung, hình ảnh và các kênh truyền thông của câu lạc bộ.',
            'head_role'   => 'communications-head',
        ],
        [
            'name'        => 'Ban Tình nguyện',
            'slug'        => 'tinh-nguyen',
            'description' => 'Phụ trách hoạt động cộng đồng, điều phối tình nguyện viên và kết nối đối tác xã hội.',
            'head_role'   => 'volunteer-head',
        ],
        // Mở rộng thêm ban mới ở đây — ví dụ:
        // [
        //     'name'      => 'Ban Sự kiện',
        //     'slug'      => 'su-kien',
        //     'description' => 'Phụ trách tổ chức và điều phối các sự kiện của câu lạc bộ.',
        //     'head_role' => 'events-head',   // cần tạo role tương ứng trong RoleSeeder
        // ],
        // [
        //     'name'      => 'Ban Media',
        //     'slug'      => 'media',
        //     'description' => 'Phụ trách sản xuất nội dung video và đồ họa.',
        //     'head_role' => 'media-head',    // cần tạo role tương ứng trong RoleSeeder
        // ],
    ];

    public function run(): void
    {
        // Cache toàn bộ role name → id để tránh N+1 query
        $roleIdByName = Role::pluck('id', 'name');

        foreach ($this->departments as $data) {
            Department::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name'         => $data['name'],
                    'description'  => $data['description'],
                    'is_active'    => true,
                    'head_role_id' => isset($data['head_role'])
                        ? ($roleIdByName[$data['head_role']] ?? null)
                        : null,
                ],
            );
        }
    }
}
