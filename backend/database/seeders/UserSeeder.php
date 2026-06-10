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
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'username'  => 'admin',
                'full_name' => 'Quản trị viên',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::ADMIN->value]);

        User::firstOrCreate(
            ['email' => 'president@gmail.com'],
            [
                'username'  => 'president',
                'full_name' => 'Chủ nhiệm CLB',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::PRESIDENT->value]);

        User::firstOrCreate(
            ['email' => 'vicepresident@gmail.com'],
            [
                'username'  => 'vicepresident',
                'full_name' => 'Phó Chủ nhiệm CLB',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::VICE_PRESIDENT->value]);

        User::firstOrCreate(
            ['email' => 'academichead@gmail.com'],
            [
                'username'  => 'academichead',
                'full_name' => 'Trưởng ban Học thuật',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::ACADEMIC_HEAD->value]);

        User::firstOrCreate(
            ['email' => 'communicationshead@gmail.com'],
            [
                'username'  => 'communicationshead',
                'full_name' => 'Trưởng ban Truyền thông',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::COMMUNICATIONS_HEAD->value]);

        User::firstOrCreate(
            ['email' => 'volunteerhead@gmail.com'],
            [
                'username'  => 'volunteerhead',
                'full_name' => 'Trưởng ban Tình nguyện',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::VOLUNTEER_HEAD->value]);

        User::firstOrCreate(
            ['email' => 'clubmember@gmail.com'],
            [
                'username'  => 'clubmember',
                'full_name' => 'Thành viên CLB',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::CLUB_MEMBER->value]);

        User::firstOrCreate(
            ['email' => 'user@gmail.com'],
            [
                'username'  => 'user',
                'full_name' => 'Người dùng',
                'password'  => bcrypt('Admin@123'),
                'is_active' => true,
            ],
        )->syncRoles([RolesEnum::USER->value]);

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

        $students = [
            ['full_name' => 'Nguyễn Minh Anh', 'email' => 'student1@gmail.com', 'student_code' => 'CD220001', 'class' => 'CD22PM1'],
            ['full_name' => 'Trần Hải Đăng', 'email' => 'student2@gmail.com', 'student_code' => 'CD220002', 'class' => 'CD22PM2'],
            ['full_name' => 'Lê Thu Hà', 'email' => 'student3@gmail.com', 'student_code' => 'CD220003', 'class' => 'CD22KHMT1'],
            ['full_name' => 'Phạm Quốc Huy', 'email' => 'student4@gmail.com', 'student_code' => 'CD220004', 'class' => 'CD22MMT1'],
            ['full_name' => 'Võ Khánh Linh', 'email' => 'student5@gmail.com', 'student_code' => 'CD220005', 'class' => 'CD22HTTT1'],
            ['full_name' => 'Đỗ Gia Bảo', 'email' => 'student6@gmail.com', 'student_code' => 'CD230006', 'class' => 'CD23AI1'],
            ['full_name' => 'Bùi Ngọc Mai', 'email' => 'student7@gmail.com', 'student_code' => 'CD230007', 'class' => 'CD23TMĐT1'],
            ['full_name' => 'Phan Nhật Minh', 'email' => 'student8@gmail.com', 'student_code' => 'CD230008', 'class' => 'CD23MKT1'],
            ['full_name' => 'Hoàng Bảo Trâm', 'email' => 'student9@gmail.com', 'student_code' => 'CD230009', 'class' => 'CD23TK1'],
            ['full_name' => 'Ngô Đức Thành', 'email' => 'student10@gmail.com', 'student_code' => 'CD230010', 'class' => 'CD23TATM1'],
        ];

        foreach ($students as $student) {
            $class = SchoolClass::where('value', $student['class'])->first();
            $major = $class ? Major::find($class->major_id) : null;

            User::updateOrCreate(
                ['email' => $student['email']],
                [
                    'full_name' => $student['full_name'],
                    'student_code' => $student['student_code'],
                    'is_active' => true,
                    'faculty_id' => $major?->faculty_id,
                    'major_id' => $major?->id,
                    'class_id' => $class?->id,
                ]
            );
        }
    }
}
