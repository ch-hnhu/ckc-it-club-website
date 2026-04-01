<?php

namespace Database\Seeders;

use App\Models\Major;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'Quản trị viên',
                'is_active' => true,
            ]
        );

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
