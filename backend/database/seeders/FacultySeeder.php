<?php

namespace Database\Seeders;

use App\Models\Faculty;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FacultySeeder extends Seeder
{
    public function run(): void
    {
        $faculties = [
            'Công nghệ Thông tin',
            'Kinh tế Thương mại',
            'Công nghệ Điện tử',
            'Công nghệ Cơ khí',
            'Kỹ thuật Ô tô',
            'Quản trị Kinh doanh',
            'Thiết kế Đồ họa',
            'Ngôn ngữ Anh',
            'Du lịch - Nhà hàng - Khách sạn',
            'Tài chính - Kế toán',
        ];

        foreach ($faculties as $faculty) {
            Faculty::firstOrCreate(
                ['value' => $faculty],
                [
                    'label' => $faculty,
                    'slug' => Str::slug($faculty),
                ]
            );
        }
    }
}
