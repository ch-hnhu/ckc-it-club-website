<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSkillSeeder extends Seeder
{
    public function run(): void
    {
        $skillIds = Skill::pluck('id', 'slug');

        if ($skillIds->isEmpty()) {
            return;
        }

        // Bộ kỹ năng theo từng tài khoản demo (slug của skill).
        $skillsByEmail = [
            'admin@gmail.com'     => ['php', 'laravel', 'sql', 'git-github', 'docker', 'linux'],
            'clubmember@gmail.com' => ['html', 'css', 'javascript', 'git-github'],
            'student1@gmail.com'  => ['html', 'css', 'javascript', 'react', 'typescript'],
            'student2@gmail.com'  => ['php', 'laravel', 'sql', 'git-github'],
            'student3@gmail.com'  => ['python', 'sql', 'linux'],
            'student4@gmail.com'  => ['javascript', 'nodejs', 'docker'],
            'student5@gmail.com'  => ['html', 'css', 'javascript'],
            'student6@gmail.com'  => ['python', 'c'],
            'student7@gmail.com'  => ['html', 'css', 'react'],
            'student8@gmail.com'  => ['java', 'sql'],
            'student9@gmail.com'  => ['html', 'css', 'javascript', 'typescript'],
            'student10@gmail.com' => ['php', 'sql', 'git-github'],
        ];

        foreach ($skillsByEmail as $email => $slugs) {
            $userId = User::where('email', $email)->value('id');

            if (! $userId) {
                continue;
            }

            foreach ($slugs as $slug) {
                $skillId = $skillIds[$slug] ?? null;

                if (! $skillId) {
                    continue;
                }

                DB::table('user_skills')->insertOrIgnore([
                    'user_id'  => $userId,
                    'skill_id' => $skillId,
                ]);
            }
        }
    }
}
