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
        $students = User::where('email', 'like', 'student%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->values();

        // Alias theo thứ tự student1..student10 để kịch bản hội thoại dễ đọc.
        $u = fn (int $n) => $students[$n - 1] ?? $adminId;

        $rooms = [
            [
                'name' => 'Chung',
                'description' => 'Kênh trò chuyện chung cho tất cả thành viên CKC IT Club.',
                'members' => $students->all(),
                'messages' => [
                    [$adminId, 'Chào cả nhà 👋 Nhóm chat chung của CLB đây, có gì cứ trao đổi thoải mái nhé!', 2880],
                    [$u(1), 'Chào admin và mọi người ạ! 🎉', 2870],
                    [$u(5), 'Tuần này CLB có buổi sinh hoạt không mọi người?', 1500],
                    [$adminId, 'Có nhé, **chiều thứ 6** tại phòng sinh hoạt CLB. Lịch chi tiết mình đã đăng ở mục Sự kiện.', 1490],
                    [$u(8), 'Mình xin đăng ký chụp ảnh cho buổi sinh hoạt luôn 📸', 1480],
                    [$u(2), 'Ai đi workshop REST API tuần sau điểm danh cái nhé, mình đặt chỗ ngồi gần nhau 😄', 300],
                    [$u(1), 'Mình mình! Đi cùng nha 🙋‍♀️', 295],
                    [$u(10), 'Em thành viên mới, mọi người cho em hỏi lịch sinh hoạt định kỳ của CLB với ạ?', 60],
                    [$adminId, 'Chào em! CLB sinh hoạt **định kỳ 2 tuần/lần** vào chiều thứ 6. Em xem thêm ở kênh *Thông báo CLB* nhé.', 50],
                ],
            ],
            [
                'name' => 'Lập trình web',
                'description' => 'Thảo luận về frontend, backend, fullstack và các công nghệ web.',
                'members' => [$u(1), $u(2), $u(3), $u(4), $u(5), $u(9)],
                'messages' => [
                    [$u(2), 'Mọi người ơi, giữa `useMemo` và `useCallback` khác nhau thế nào nhỉ? Đọc docs mãi vẫn lơ mơ 😅', 1200],
                    [$u(1), '`useMemo` cache **giá trị** tính toán, còn `useCallback` cache **chính function**. Nhớ đơn giản: `useCallback(fn, deps)` = `useMemo(() => fn, deps)` đó bạn.', 1190],
                    [$u(2), 'Ồ ví dụ dễ hiểu thật, cảm ơn bạn nhiều! 🙏', 1185],
                    [$u(4), 'Team nào cần cấu hình Docker cho Laravel thì ngó bài mình mới đăng bên kênh cộng đồng nhé, có sẵn `docker-compose.yml` mẫu.', 700],
                    [$u(5), 'Đúng lúc mình đang cần, cảm ơn bạn 🐳', 690],
                    [$u(1), 'Tuần sau nhóm mình mở *mini code review* cho project cá nhân, ai muốn được góp ý code thì đăng ký ở đây nha 👩‍💻', 120],
                ],
            ],
            [
                'name' => 'Lập trình di động',
                'description' => 'Thảo luận về Android, iOS, Flutter, React Native...',
                'members' => [$u(6), $u(1), $u(7)],
                'messages' => [
                    [$u(6), 'Có ai đang học **Flutter** không? Lập nhóm học chung cho có động lực đi 📱', 400],
                    [$u(7), 'Mình mới cài xong môi trường, join với! Chạy `flutter doctor` toàn dấu tick xanh rồi 😆', 390],
                ],
            ],
            [
                'name' => 'AI & Machine Learning',
                'description' => 'Chia sẻ về trí tuệ nhân tạo, học máy và khoa học dữ liệu.',
                'members' => [$u(3), $u(6)],
                'messages' => [
                    [$u(3), 'Chia sẻ nhỏ: khoá *Machine Learning Specialization* của Andrew Ng trên Coursera có thể *audit miễn phí* nhé mọi người.', 800],
                    [$u(6), 'Cảm ơn chị, em đang học tuần 2, phần gradient descent hơi xoắn não nhưng thú vị lắm ạ 🤖', 780],
                ],
            ],
            [
                'name' => 'Hỏi đáp & Hỗ trợ',
                'description' => 'Đặt câu hỏi và hỗ trợ nhau trong quá trình học tập.',
                'members' => $students->all(),
                'messages' => [
                    [$u(10), 'Mọi người ơi, em chạy `php artisan migrate` bị lỗi `SQLSTATE[HY000] [2002] Connection refused` là sao ạ? 😭', 500],
                    [$u(2), 'MySQL chưa chạy đó em. Kiểm tra XAMPP/Docker xem service MySQL đã start chưa, và xem `DB_HOST` trong file `.env` nhé.', 490],
                    [$u(4), 'Nếu dùng Docker thì `DB_HOST` phải là **tên service** (vd `mysql`) chứ không phải `127.0.0.1` nha.', 485],
                    [$u(10), 'Dạ đúng luôn, MySQL chưa start 🤦 Cảm ơn hai anh nhiều ạ!', 470],
                ],
            ],
            [
                'name' => 'Sự kiện & Hoạt động',
                'description' => 'Thông tin về các sự kiện, cuộc thi và hoạt động của CLB.',
                'members' => [$u(1), $u(2), $u(5), $u(8)],
                'messages' => [
                    [$u(8), 'Album ảnh workshop **Git & GitHub** đã lên sóng ở trang sự kiện nhé mọi người, vào hóng ảnh của mình đi 📷✨', 900],
                    [$u(5), 'Ảnh đẹp quá trời! Buổi đó vui thật sự 🥰', 880],
                ],
            ],
            [
                'name' => 'Cơ hội nghề nghiệp',
                'description' => 'Chia sẻ thông tin thực tập, việc làm và cơ hội nghề nghiệp.',
                'members' => [$u(1), $u(2), $u(3), $u(4)],
                'messages' => [
                    [$adminId, 'Danh sách tin tuyển **thực tập sinh tháng 7** đã đăng ở kênh Thực tập, các bạn năm 2–3 chú ý deadline nhé!', 600],
                    [$u(3), 'Em cảm ơn ạ, đang nhắm vị trí Data intern của TMA 🤞', 590],
                ],
            ],
        ];

        foreach ($rooms as $room) {
            $existing = DB::table('chat_rooms')
                ->where('name', $room['name'])
                ->first();

            if ($existing) {
                continue;
            }

            $roomId = DB::table('chat_rooms')->insertGetId([
                'name'       => $room['name'],
                'created_at' => now()->subDays(30),
                'updated_at' => now(),
            ]);

            if ($adminId) {
                DB::table('chat_members')->insertOrIgnore([
                    'room_id'      => $roomId,
                    'user_id'      => $adminId,
                    'role'         => 'admin',
                    'last_read_at' => now(),
                    'created_at'   => now()->subDays(30),
                    'updated_at'   => now(),
                ]);
            }

            foreach (array_unique(array_filter($room['members'])) as $memberId) {
                DB::table('chat_members')->insertOrIgnore([
                    'room_id'      => $roomId,
                    'user_id'      => $memberId,
                    'role'         => 'member',
                    'last_read_at' => now(),
                    'created_at'   => now()->subDays(30),
                    'updated_at'   => now(),
                ]);
            }

            // Hội thoại mẫu: [người gửi, nội dung (markdown), số phút trước].
            foreach ($room['messages'] as [$senderId, $content, $minutesAgo]) {
                if (! $senderId) {
                    continue;
                }

                DB::table('messages')->insert([
                    'room_id'    => $roomId,
                    'content'    => $content,
                    'type'       => 'text',
                    'created_by' => $senderId,
                    'created_at' => now()->subMinutes($minutesAgo),
                    'updated_at' => now()->subMinutes($minutesAgo),
                ]);
            }
        }
    }
}
