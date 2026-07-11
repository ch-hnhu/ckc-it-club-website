<?php

namespace Database\Seeders;

use App\Enums\RolesEnum;
use App\Models\Major;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tài khoản demo cho từng vai trò ──────────────────────────────────────
        // Avatar dùng ảnh chân dung randomuser.me khớp giới tính;
        // tài khoản không có avatar sẽ dùng fallback ui-avatars của frontend.
        $roleAccounts = [
            [
                'email'     => 'admin@gmail.com',
                'username'  => 'admin',
                'full_name' => 'Quản trị viên',
                'role'      => RolesEnum::ADMIN,
                // Avatar dạng lettermark — thể hiện tài khoản hệ thống chính thức.
                'avatar'    => 'https://ui-avatars.com/api/?name=CKC&background=1e3a8a&color=fff&size=256&bold=true',
                'bio'       => 'Tài khoản quản trị hệ thống website CLB IT CKC.',
            ],
            [
                'email'     => 'president@gmail.com',
                'username'  => 'president',
                'full_name' => 'Đinh Nguyễn Bá Tài',
                'role'      => RolesEnum::PRESIDENT,
                'gender'    => 'male',
                'avatar'    => 'storage/app/public/avatars/president.jpg',
                'cover_image' => 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=70',
                'bio'       => 'Chủ nhiệm CLB IT CKC. Đam mê xây dựng cộng đồng lập trình sinh viên Cao Thắng. 🚀',
            ],
            [
                'email'     => 'vicepresident@gmail.com',
                'username'  => 'vicepresident',
                'full_name' => 'Lê Ngọc Hân',
                'role'      => RolesEnum::VICE_PRESIDENT,
                'gender'    => 'female',
                'avatar'    => 'https://randomuser.me/api/portraits/women/65.jpg',
                'bio'       => 'Phó Chủ nhiệm CLB IT CKC — phụ trách đối nội và hoạt động thành viên.',
            ],
            [
                'email'     => 'academichead@gmail.com',
                'username'  => 'academichead',
                'full_name' => 'Phạm Đức Long',
                'role'      => RolesEnum::ACADEMIC_HEAD,
                'gender'    => 'male',
                'avatar'    => 'https://randomuser.me/api/portraits/men/45.jpg',
                'bio'       => 'Trưởng ban Học thuật — mentor các khoá lập trình web của CLB. Backend PHP/Laravel.',
            ],
            [
                'email'     => 'communicationshead@gmail.com',
                'username'  => 'communicationshead',
                'full_name' => 'Đặng Thuỳ Dương',
                'role'      => RolesEnum::COMMUNICATIONS_HEAD,
                'gender'    => 'female',
                'avatar'    => 'https://randomuser.me/api/portraits/women/21.jpg',
                'bio'       => 'Trưởng ban Truyền thông — kể chuyện CLB bằng hình ảnh và con chữ. 📸',
            ],
            [
                'email'     => 'volunteerhead@gmail.com',
                'username'  => 'volunteerhead',
                'full_name' => 'Võ Minh Trí',
                'role'      => RolesEnum::VOLUNTEER_HEAD,
                'gender'    => 'male',
                'avatar'    => 'https://randomuser.me/api/portraits/men/78.jpg',
                'bio'       => 'Trưởng ban Tình nguyện — mang công nghệ đến gần hơn với cộng đồng. 💚',
            ],
            [
                'email'     => 'clubmember@gmail.com',
                'username'  => 'clubmember',
                'full_name' => 'Lý Gia Hân',
                'role'      => RolesEnum::CLUB_MEMBER,
                'gender'    => 'female',
                'avatar'    => 'https://randomuser.me/api/portraits/women/12.jpg',
                'bio'       => 'Thành viên CLB IT CKC — thích tham gia workshop và các hoạt động giao lưu.',
            ],
            [
                // Người dùng thường, chưa cập nhật avatar → demo fallback avatar mặc định.
                'email'     => 'user@gmail.com',
                'username'  => 'user',
                'full_name' => 'Trần Văn An',
                'role'      => RolesEnum::USER,
                'bio'       => 'Sinh viên quan tâm đến CLB, đang tìm hiểu để đăng ký thành viên.',
            ],
        ];

        foreach ($roleAccounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'username'    => $account['username'],
                    'full_name'   => $account['full_name'],
                    'password'    => bcrypt('Admin@123'),
                    'gender'      => $account['gender'] ?? null,
                    'avatar'      => $account['avatar'] ?? null,
                    'cover_image' => $account['cover_image'] ?? null,
                    'bio'         => $account['bio'] ?? null,
                    'is_active'   => true,
                ],
            )->syncRoles([$account['role']->value]);
        }

        // ── Tài khoản cá nhân / test cũ ─────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'hnhu07012004@gmail.com'],
            ['full_name' => 'Thành viên', 'is_active' => true],
        )->syncRoles([RolesEnum::USER->value]);
        User::firstOrCreate(
            ['email' => '0306231334@caothang.edu.vn'],
            ['full_name' => 'Thành viên', 'is_active' => true],
        )->syncRoles([RolesEnum::USER->value]);
        User::firstOrCreate(
            ['email' => '0306231295@caothang.edu.vn'],
            ['full_name' => 'Thành viên', 'is_active' => true],
        )->syncRoles([RolesEnum::USER->value]);
        User::firstOrCreate(
            ['email' => '0306231289@caothang.edu.vn'],
            ['full_name' => 'Thành viên', 'is_active' => true],
        )->syncRoles([RolesEnum::USER->value]);

        // Test member: tài khoản thành viên có mật khẩu, dùng cho test forgot password & login member
        User::firstOrCreate(
            ['email' => 'testmember@gmail.com'],
            [
                'username' => 'testmember',
                'full_name' => 'Thành viên test',
                'password' => bcrypt('Test@123456'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::USER->value]);

        // Locked user: tài khoản bị khóa (is_active = false), dùng cho test đăng nhập bị khóa
        User::firstOrCreate(
            ['email' => 'locked@gmail.com'],
            [
                'username' => 'lockeduser',
                'full_name' => 'Tài khoản bị khóa',
                'password' => bcrypt('Test@123456'),
                'is_active' => false,
            ],
        )->syncRoles([RolesEnum::USER->value]);

        // ── Sinh viên demo: là thành viên CLB, có mật khẩu để đăng nhập khi quay demo ──
        // Avatar chân dung khớp giới tính (randomuser.me: /women/N hoặc /men/N).
        $students = [
            [
                'full_name' => 'Nguyễn Minh Anh', 'email' => 'student1@gmail.com',
                'student_code' => 'CD220001', 'class' => 'CD22PM1', 'gender' => 'female',
                'avatar' => 'https://randomuser.me/api/portraits/women/44.jpg',
                'cover_image' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=70',
                'bio' => 'Frontend developer tương lai 🌱 Yêu thích **React** và những giao diện đẹp. Mentor khoá *Lập trình Web Cơ Bản* của CLB.',
                'social_github' => 'minhanh-dev', 'social_linkedin' => 'nguyen-minh-anh',
            ],
            [
                'full_name' => 'Trần Hải Đăng', 'email' => 'student2@gmail.com',
                'student_code' => 'CD220002', 'class' => 'CD22PM2', 'gender' => 'male',
                'avatar' => 'https://randomuser.me/api/portraits/men/22.jpg',
                'cover_image' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=70',
                'bio' => 'Backend Laravel • Thích tối ưu query và viết API sạch. Đang luyện thêm Docker & CI/CD.',
                'social_github' => 'haidang-tran',
            ],
            [
                'full_name' => 'Lê Thu Hà', 'email' => 'student3@gmail.com',
                'student_code' => 'CD220003', 'class' => 'CD22KHMT1', 'gender' => 'female',
                'avatar' => 'https://randomuser.me/api/portraits/women/68.jpg',
                'bio' => 'Đang học Python và phân tích dữ liệu. Mơ ước trở thành Data Engineer. 📊',
            ],
            [
                'full_name' => 'Phạm Quốc Huy', 'email' => 'student4@gmail.com',
                'student_code' => 'CD220004', 'class' => 'CD22MMT1', 'gender' => 'male',
                'avatar' => 'https://randomuser.me/api/portraits/men/55.jpg',
                'bio' => 'DevOps enthusiast — Docker, Linux và CI/CD. Người giữ server của CLB luôn xanh. 🐧',
                'social_github' => 'quochuy-ops',
            ],
            [
                'full_name' => 'Võ Khánh Linh', 'email' => 'student5@gmail.com',
                'student_code' => 'CD220005', 'class' => 'CD22HTTT1', 'gender' => 'female',
                'avatar' => 'https://randomuser.me/api/portraits/women/17.jpg',
                'bio' => 'Thích làm web và tham gia hoạt động tình nguyện của CLB. 💚',
            ],
            [
                'full_name' => 'Đỗ Gia Bảo', 'email' => 'student6@gmail.com',
                'student_code' => 'CD230006', 'class' => 'CD23AI1', 'gender' => 'male',
                'avatar' => 'https://randomuser.me/api/portraits/men/36.jpg',
                'bio' => 'Tân binh AI 🤖 đang học machine learning cơ bản và mê mobile dev.',
            ],
            [
                'full_name' => 'Bùi Ngọc Mai', 'email' => 'student7@gmail.com',
                'student_code' => 'CD230007', 'class' => 'CD23TMĐT1', 'gender' => 'female',
                'avatar' => 'https://randomuser.me/api/portraits/women/90.jpg',
                'bio' => 'Mê thiết kế UI/UX và Figma. Vẽ giao diện cho các dự án của CLB. 🎨',
            ],
            [
                'full_name' => 'Phan Nhật Minh', 'email' => 'student8@gmail.com',
                'student_code' => 'CD230008', 'class' => 'CD23MKT1', 'gender' => 'male',
                'avatar' => 'https://randomuser.me/api/portraits/men/64.jpg',
                'bio' => 'Ban Truyền thông — viết content và chụp ảnh sự kiện.',
            ],
            [
                'full_name' => 'Hoàng Bảo Trâm', 'email' => 'student9@gmail.com',
                'student_code' => 'CD230009', 'class' => 'CD23TK1', 'gender' => 'female',
                'avatar' => 'https://randomuser.me/api/portraits/women/33.jpg',
                'bio' => 'Thiết kế đồ họa cho các ấn phẩm của CLB.',
            ],
            [
                'full_name' => 'Ngô Đức Thành', 'email' => 'student10@gmail.com',
                'student_code' => 'CD230010', 'class' => 'CD23TATM1', 'gender' => 'male',
                'avatar' => 'https://randomuser.me/api/portraits/men/85.jpg',
                'bio' => 'Thành viên mới, đang học khoá Lập trình Web Cơ Bản của CLB.',
            ],
        ];

        foreach ($students as $i => $student) {
            $class = SchoolClass::where('value', $student['class'])->first();
            $major = $class ? Major::find($class->major_id) : null;

            User::updateOrCreate(
                ['email' => $student['email']],
                [
                    'username' => 'student' . ($i + 1),
                    'full_name' => $student['full_name'],
                    'password' => bcrypt('Member@123'),
                    'student_code' => $student['student_code'],
                    'gender' => $student['gender'],
                    'avatar' => $student['avatar'],
                    'cover_image' => $student['cover_image'] ?? null,
                    'bio' => $student['bio'],
                    'social_github' => $student['social_github'] ?? null,
                    'social_linkedin' => $student['social_linkedin'] ?? null,
                    'is_active' => true,
                    'faculty_id' => $major?->faculty_id,
                    'major_id' => $major?->id,
                    'class_id' => $class?->id,
                ]
            )->syncRoles([RolesEnum::CLUB_MEMBER->value]);
        }
    }
}
