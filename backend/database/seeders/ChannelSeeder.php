<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChannelSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id');

        $channels = [
            [
                'name'        => 'Thông báo CLB',
                'description' => 'Kênh thông báo chính thức của CLB IT CKC.',
            ],
            [
                'name'        => 'Học thuật & Kỹ thuật',
                'description' => 'Thảo luận về kỹ thuật, lập trình và công nghệ.',
            ],
            [
                'name'        => 'Sự kiện & Hoạt động',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
            ],
            [
                'name'        => 'Góc chia sẻ',
                'description' => 'Không gian chia sẻ kinh nghiệm, tài liệu học tập và cơ hội nghề nghiệp.',
            ],
            [
                'name'        => 'Câu hỏi & Hỗ trợ',
                'description' => 'Đặt câu hỏi và hỗ trợ lẫn nhau trong quá trình học tập.',
            ],
        ];

        foreach ($channels as $channel) {
            $slug = Str::slug($channel['name']);
            DB::table('channels')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name'        => $channel['name'],
                    'slug'        => $slug,
                    'description' => $channel['description'],
                    'created_by'  => $adminId,
                    'updated_by'  => $adminId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
