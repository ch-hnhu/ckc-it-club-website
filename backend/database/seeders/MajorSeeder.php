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
        $majorsByFaculty = [
            'Công nghệ thông tin' => [
                'Công nghệ Thông tin',
                'Quản trị mạng máy tính',
                'Kỹ thuật sửa chữa, lắp ráp máy tính',
            ],
            'Điện - Điện tử' => [
                'Công nghệ Kỹ thuật Điện, Điện tử',
                'Công nghệ Kỹ thuật Điện tử - Viễn thông',
                'Điện công nghiệp',
                'Điện tử công nghiệp',
            ],
            'Cơ khí' => [
                'Cơ khí chế tạo',
                'Sửa chữa cơ khí',
                'Hàn',
            ],
            'Ô tô' => [
                'Công nghệ Kỹ thuật Ô tô',
                'Bảo trì, sửa chữa ô tô',
            ],
            'Nhiệt lạnh' => [
                'Công nghệ Kỹ thuật Nhiệt',
                'Kỹ thuật máy lạnh và điều hòa không khí',
            ],
            'Tự động hóa' => [
                'Công nghệ Kỹ thuật Điều khiển và Tự động hóa',
            ],
            'Bộ môn Kinh tế' => [
                'Kế toán doanh nghiệp',
            ],
        ];

        foreach ($majorsByFaculty as $facultyName => $majors) {
            $faculty = Faculty::where('slug', Str::slug($facultyName))->first();

            if (! $faculty) {
                continue;
            }

            foreach ($majors as $majorName) {
                Major::updateOrCreate(
                    ['slug' => Str::slug($majorName)],
                    [
                        'value' => $majorName,
                        'label' => $majorName,
                        'faculty_id' => $faculty->id,
                    ]
                );
            }
        }
    }
}
