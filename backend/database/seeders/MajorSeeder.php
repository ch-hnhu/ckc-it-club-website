<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Major;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MajorSeeder extends Seeder
{
    public function run(): void
    {
        $majors = [
            ['faculty' => 'Công nghệ Thông tin', 'value' => 'Kỹ thuật Phần mềm'],
            ['faculty' => 'Công nghệ Thông tin', 'value' => 'Khoa học Máy tính'],
            ['faculty' => 'Công nghệ Thông tin', 'value' => 'Mạng máy tính và Truyền thông dữ liệu'],
            ['faculty' => 'Công nghệ Thông tin', 'value' => 'Hệ thống thông tin'],
            ['faculty' => 'Công nghệ Thông tin', 'value' => 'Trí tuệ Nhân tạo'],
            ['faculty' => 'Kinh tế Thương mại', 'value' => 'Thương mại điện tử'],
            ['faculty' => 'Quản trị Kinh doanh', 'value' => 'Marketing'],
            ['faculty' => 'Thiết kế Đồ họa', 'value' => 'Thiết kế Đa phương tiện'],
            ['faculty' => 'Ngôn ngữ Anh', 'value' => 'Tiếng Anh thương mại'],
            ['faculty' => 'Tài chính - Kế toán', 'value' => 'Kế toán doanh nghiệp'],
        ];

        foreach ($majors as $major) {
            $faculty = Faculty::where('value', $major['faculty'])->first();

            if (!$faculty) {
                continue;
            }

            Major::firstOrCreate(
                ['value' => $major['value']],
                [
                    'label' => $major['value'],
                    'slug' => Str::slug($major['value']),
                    'faculty_id' => $faculty->id,
                ]
            );
        }
    }
}
