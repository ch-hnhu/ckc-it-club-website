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
            'Công nghệ thông tin',
            'Cơ khí',
            'Cơ khí động lực',
            'Điện - Điện tử',
            'Công nghệ nhiệt - lạnh',
            'Giáo dục đại cương',
            'Bộ môn Kinh tế',
        ];

        foreach ($faculties as $faculty) {
            Faculty::updateOrCreate(
                ['slug' => Str::slug($faculty)],
                [
                    'value' => $faculty,
                    'label' => $faculty,
                ]
            );
        }
    }
}
