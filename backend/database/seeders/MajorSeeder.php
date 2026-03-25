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
        $faculty = Faculty::where('value', 'Công nghệ Thông tin')->first();
        if (!$faculty) return;

        $majors = [
            'Kỹ thuật Phần mềm',
            'Khoa học Máy tính',
            'Mạng máy tính và TT',
            'Hệ thống thông tin',
            'Trí tuệ Nhân tạo',
        ];

        foreach ($majors as $major) {
            Major::firstOrCreate(
                ['value' => $major],
                [
                    'label' => $major,
                    'slug' => Str::slug($major),
                    'faculty_id' => $faculty->id,
                ]
            );
        }
    }
}
