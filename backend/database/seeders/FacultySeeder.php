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
        ];

        foreach ($faculties as $faculty) {
            Faculty::firstOrCreate(
                ['value' => $faculty],
                [
                    'label' => $faculty,
                    'slug' => Str::slug($faculty)
                ]
            );
        }
    }
}