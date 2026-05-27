<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id');

        $tags = [
            ['name' => 'Python',                'color' => '#3b82f6', 'description' => 'Ngôn ngữ lập trình Python.'],
            ['name' => 'JavaScript',            'color' => '#eab308', 'description' => 'Ngôn ngữ lập trình JavaScript.'],
            ['name' => 'Web Development',       'color' => '#6366f1', 'description' => 'Phát triển ứng dụng web.'],
            ['name' => 'AI & Machine Learning', 'color' => '#8b5cf6', 'description' => 'Trí tuệ nhân tạo và học máy.'],
            ['name' => 'Lập trình',             'color' => '#14b8a6', 'description' => 'Chủ đề lập trình tổng quát.'],
            ['name' => 'Hackathon',             'color' => '#ef4444', 'description' => 'Các cuộc thi lập trình.'],
            ['name' => 'Sự kiện',               'color' => '#f97316', 'description' => 'Các sự kiện của CLB.'],
            ['name' => 'Workshop',              'color' => '#22c55e', 'description' => 'Các buổi workshop và đào tạo.'],
            ['name' => 'Đồ án',                 'color' => '#06b6d4', 'description' => 'Hỗ trợ và chia sẻ về đồ án.'],
            ['name' => 'Học bổng',              'color' => '#f59e0b', 'description' => 'Thông tin học bổng và cơ hội học tập.'],
            ['name' => 'Thực tập',              'color' => '#10b981', 'description' => 'Cơ hội thực tập và việc làm.'],
            ['name' => 'Database',              'color' => '#64748b', 'description' => 'Cơ sở dữ liệu và SQL.'],
            ['name' => 'Mobile App',            'color' => '#ec4899', 'description' => 'Phát triển ứng dụng di động.'],
            ['name' => 'DevOps',                'color' => '#a855f7', 'description' => 'DevOps, CI/CD và hạ tầng.'],
            ['name' => 'Cybersecurity',         'color' => '#dc2626', 'description' => 'An toàn thông tin và bảo mật.'],
        ];

        foreach ($tags as $tag) {
            $slug = Str::slug($tag['name']);
            DB::table('tags')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name'        => $tag['name'],
                    'slug'        => $slug,
                    'description' => $tag['description'],
                    'color'       => $tag['color'],
                    'created_by'  => $adminId,
                    'updated_by'  => $adminId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
