<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChatRoomSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id');

        $rooms = [
            [
                'name' => 'Chung',
                'description' => 'Kênh trò chuyện chung cho tất cả thành viên CKC IT Club.',
            ],
            [
                'name' => 'Lập trình web',
                'description' => 'Thảo luận về frontend, backend, fullstack và các công nghệ web.',
            ],
            [
                'name' => 'Lập trình di động',
                'description' => 'Thảo luận về Android, iOS, Flutter, React Native...',
            ],
            [
                'name' => 'AI & Machine Learning',
                'description' => 'Chia sẻ về trí tuệ nhân tạo, học máy và khoa học dữ liệu.',
            ],
            [
                'name' => 'Hỏi đáp & Hỗ trợ',
                'description' => 'Đặt câu hỏi và hỗ trợ nhau trong quá trình học tập.',
            ],
            [
                'name' => 'Sự kiện & Hoạt động',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
            ],
            [
                'name' => 'Cơ hội nghề nghiệp',
                'description' => 'Chia sẻ thông tin thực tập, việc làm và cơ hội nghề nghiệp.',
            ],
        ];

        foreach ($rooms as $room) {
            $existing = DB::table('chat_rooms')
                ->where('type', 'group')
                ->where('name', $room['name'])
                ->first();

            if ($existing) {
                continue;
            }

            $roomId = DB::table('chat_rooms')->insertGetId([
                'type'       => 'group',
                'name'       => $room['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($adminId) {
                DB::table('chat_members')->insertOrIgnore([
                    'room_id'      => $roomId,
                    'user_id'      => $adminId,
                    'role'         => 'admin',
                    'last_read_at' => now(),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        }
    }
}
