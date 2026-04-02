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
            'Cong nghe thong tin',
            'Dien - Dien tu',
            'Co khi',
            'O to',
            'Nhiet lanh',
            'Tu dong hoa',
            'Bo mon Kinh te',
            'Cong nghiep',
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
