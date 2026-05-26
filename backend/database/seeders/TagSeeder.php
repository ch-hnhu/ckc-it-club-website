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
            ['name' => 'Python',              'description' => 'Ngôn ngữ lập trình Python.'],
            ['name' => 'JavaScript',          'description' => 'Ngôn ngữ lập trình JavaScript.'],
            ['name' => 'Web Development',     'description' => 'Phát triển ứng dụng web.'],
            ['name' => 'AI & Machine Learning', 'description' => 'Trí tuệ nhân tạo và học máy.'],
            ['name' => 'Lập trình',           'description' => 'Chủ đề lập trình tổng quát.'],
            ['name' => 'Hackathon',           'description' => 'Các cuộc thi lập trình.'],
            ['name' => 'Sự kiện',             'description' => 'Các sự kiện của CLB.'],
            ['name' => 'Workshop',            'description' => 'Các buổi workshop và đào tạo.'],
            ['name' => 'Đồ án',               'description' => 'Hỗ trợ và chia sẻ về đồ án.'],
            ['name' => 'Học bổng',            'description' => 'Thông tin học bổng và cơ hội học tập.'],
            ['name' => 'Thực tập',            'description' => 'Cơ hội thực tập và việc làm.'],
            ['name' => 'Database',            'description' => 'Cơ sở dữ liệu và SQL.'],
            ['name' => 'Mobile App',          'description' => 'Phát triển ứng dụng di động.'],
            ['name' => 'DevOps',              'description' => 'DevOps, CI/CD và hạ tầng.'],
            ['name' => 'Cybersecurity',       'description' => 'An toàn thông tin và bảo mật.'],
        ];

        foreach ($tags as $tag) {
            $slug = Str::slug($tag['name']);
            DB::table('tags')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name'        => $tag['name'],
                    'slug'        => $slug,
                    'description' => $tag['description'],
                    'created_by'  => $adminId,
                    'updated_by'  => $adminId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
