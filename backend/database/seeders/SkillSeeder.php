<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Python',
            'Java', 'C++', 'PHP', 'SQL', 'Command Line',
            'React', 'Laravel', 'Node.js', 'Git & GitHub', 'Docker', 'Linux',
        ];

        foreach ($skills as $index => $name) {
            Skill::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $index, 'is_active' => true]
            );
        }
    }
}
