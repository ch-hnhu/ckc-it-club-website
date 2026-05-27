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
                'image' => 'https://gifdb.com/images/high/pixel-art-8bit-subaru-duck-kfvqxp9q2x0l5m30.gif',
                'description' => 'Kênh thông báo chính thức của CLB IT CKC.',
            ],
            [
                'name' => 'Lập trình web',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3o0Z2lpeGlhYnVyZHZhc2UyaTBlaDUxcjlyazJ6bHE1azFtOXhuNiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/6KirhLJyR7oMcwgJQk/giphy.gif',
                'description' => 'Chia sẻ kiến thức, tài nguyên và thảo luận về lập trình web.',
            ],
            [
                'name' => 'Lập trình di động',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bTluaHZwMmNkOW95Y3J5c2ZtZjZxMW0zajlqdnZ6dDNqZWl3bm04YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/nqmruRgwwyT1BaFKPh/giphy.gif',
                'description' => 'Chia sẻ kiến thức, tài nguyên và thảo luận về lập trình web.',
            ],
            [
                'name' => 'Sự kiện & Hoạt động',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDlsY3J1eGE5YTF2MGZreGlrYmJzdDEyNGp4bHdmbm90aXQ1dWMwOCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/p07Df5003dQeCnHBQO/giphy.gif',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
            ],
            [
                'name' => 'Thực tập',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Z6bW5vanJwaTMwa3prOWU1ZmFmb3E3Z2hwZGNoc3IyaGc5dmN3MSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/S9kucUqtJPMdkyWdyf/giphy.gif',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
            ],
            [
                'name' => 'Góc chia sẻ',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDlsY3J1eGE5YTF2MGZreGlrYmJzdDEyNGp4bHdmbm90aXQ1dWMwOCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/ao9DUiTKH60XS/giphy.gif',
                'description' => 'Không gian chia sẻ kinh nghiệm, tài liệu học tập và cơ hội nghề nghiệp.',
            ],
            [
                'name' => 'Câu hỏi & Hỗ trợ',
                'image' => 'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NW41Z2lpbGttaTNjNHJ4eTNueDlubHQ3djc1MHljZGRoZThjNmowaCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/GajHTHXHb5kEz6eJ1W/giphy.gif',
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
