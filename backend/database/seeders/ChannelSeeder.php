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
                'name' => 'Thông báo CLB',
                'image' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=70',
                'description' => 'Kênh thông báo chính thức của CLB IT CKC.',
            ],
            [
                'name' => 'Lập trình web',
                'image' => 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=70',
                'description' => 'Chia sẻ kiến thức, tài nguyên và thảo luận về lập trình web.',
            ],
            [
                'name' => 'Lập trình di động',
                'image' => 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=70',
                'description' => 'Thảo luận về Android, iOS, Flutter, React Native và phát triển ứng dụng di động.',
            ],
            [
                'name' => 'Sự kiện & Hoạt động',
                'image' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=70',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
            ],
            [
                'name' => 'Thực tập',
                'image' => 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=70',
                'description' => 'Cơ hội thực tập, việc làm và kinh nghiệm phỏng vấn cho sinh viên IT.',
            ],
            [
                'name' => 'Góc chia sẻ',
                'image' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=70',
                'description' => 'Không gian chia sẻ kinh nghiệm, tài liệu học tập và cơ hội nghề nghiệp.',
            ],
            [
                'name' => 'Câu hỏi & Hỗ trợ',
                'image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=70',
                'description' => 'Đặt câu hỏi và hỗ trợ lẫn nhau trong quá trình học tập.',
            ],
        ];

        foreach ($channels as $channel) {
            $slug = Str::slug($channel['name']);
            DB::table('channels')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $channel['name'],
                    'image' => $channel['image'],
                    'slug' => $slug,
                    'description' => $channel['description'],
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
