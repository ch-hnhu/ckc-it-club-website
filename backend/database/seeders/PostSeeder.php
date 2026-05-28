<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin || empty($students)) {
            return;
        }

        $channels = DB::table('channels')->pluck('id', 'slug');

        $posts = [
            [
                'user_id' => $admin->id,
                'channel' => 'thong-bao-clb',
                'title' => 'Chào mừng thành viên mới học kỳ 2/2025!',
                'content' => "Xin chào tất cả các thành viên!\n\nCLB IT CKC xin chào mừng các bạn sinh viên mới gia nhập trong học kỳ này. Chúng ta cùng nhau học hỏi, chia sẻ và phát triển kỹ năng công nghệ thông tin.\n\nMong rằng mỗi thành viên sẽ tích cực tham gia các hoạt động của CLB và đóng góp cho cộng đồng.",
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 30,
            ],
            [
                'user_id' => $admin->id,
                'channel' => 'su-kien-hoat-dong',
                'title' => 'Workshop: Nhập môn Machine Learning với Python',
                'content' => "CLB IT CKC tổ chức buổi Workshop:\n**Nhập môn Machine Learning với Python**\n\n📅 Thời gian: Thứ 7, 15/06/2026\n📍 Địa điểm: Phòng máy tính D402\n🎯 Dành cho: Sinh viên yêu thích AI và dữ liệu\n\nNội dung:\n- Giới thiệu về Machine Learning\n- Các thuật toán cơ bản\n- Thực hành với scikit-learn\n- Xây dựng mô hình dự đoán đơn giản\n\nĐăng ký tại link biểu mẫu bên dưới. Số lượng có hạn!",
                'media_urls' => ["https://gifdb.com/images/high/pixel-art-8bit-subaru-duck-kfvqxp9q2x0l5m30.gif"],
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 20,
            ],
            [
                'user_id' => $students[0],
                'channel' => 'hoc-thuat-ky-thuat',
                'title' => 'Tài nguyên học Web Development miễn phí cho người mới bắt đầu',
                'content' => "Mình tổng hợp một số tài nguyên học web development miễn phí chất lượng:\n\n**HTML/CSS/JS cơ bản:**\n- The Odin Project\n- freeCodeCamp\n- MDN Web Docs\n\n**React:**\n- React official docs\n- Scrimba React Course\n\n**Backend:**\n- Laravel official docs\n- Node.js tutorials\n\nMọi người có thêm tài nguyên nào hay thì comment bên dưới nhé!",
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 15,
            ],
            [
                'user_id' => $students[1] ?? $students[0],
                'channel' => 'cau-hoi-ho-tro',
                'title' => 'Hỏi về cách debug lỗi CORS trong dự án React + Laravel',
                'content' => "Mình đang làm đồ án với React frontend và Laravel backend nhưng bị lỗi CORS khi gọi API.\n\nLỗi: \"Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy\"\n\nMình đã thêm cors middleware trong Laravel nhưng vẫn bị lỗi. Mọi người có gặp vấn đề này chưa và giải quyết như thế nào ạ?",
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 12,
            ],
            [
                'user_id' => $students[2] ?? $students[0],
                'channel' => 'goc-chia-se',
                'title' => 'Chia sẻ kinh nghiệm thực tập tại công ty IT',
                'content' => "Mình vừa hoàn thành 3 tháng thực tập tại một công ty phần mềm và muốn chia sẻ một số kinh nghiệm:\n\n1. **Kỹ năng giao tiếp quan trọng không kém kỹ thuật** – Biết đặt câu hỏi đúng cách và báo cáo tiến độ giúp ích rất nhiều.\n\n2. **Git workflow** – Học cách dùng git branch, pull request trước khi đi thực tập.\n\n3. **Đọc code người khác** – Phần lớn thời gian là đọc và hiểu code có sẵn, không phải viết mới.\n\n4. **Chủ động hỏi** – Đừng ngại hỏi mentor khi bị stuck quá 30 phút.\n\nHy vọng hữu ích cho các bạn đang chuẩn bị đi thực tập!",
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 8,
            ],
            [
                'user_id' => $students[3] ?? $students[0],
                'channel' => 'hoc-thuat-ky-thuat',
                'title' => 'Hướng dẫn cài đặt môi trường Docker cho dự án Laravel',
                'content' => "Hướng dẫn cài đặt Docker cho dự án Laravel:\n\n**Bước 1**: Cài Docker Desktop\n**Bước 2**: Tạo file `docker-compose.yml` với các service: php, nginx, mysql, redis\n**Bước 3**: Chạy `docker compose up -d`\n**Bước 4**: Vào container php và chạy `composer install`, `php artisan migrate`\n\nSau khi setup xong, toàn bộ team đều có môi trường giống nhau, không còn cảnh \"máy tao chạy được mà máy mày không\"!",
                'visibility' => 'members',
                'status' => 'published',
                'days_ago' => 5,
            ],
        ];

        foreach ($posts as $post) {
            $channelId = $channels[$post['channel']] ?? null;
            if (! $channelId) {
                continue;
            }

            DB::table('posts')->updateOrInsert(
                ['user_id' => $post['user_id'], 'title' => $post['title']],
                [
                    'channel_id' => $channelId,
                    'content' => $post['content'],
                    'media_urls' => isset($post['media_urls']) ? json_encode($post['media_urls']) : null,
                    'visibility' => $post['visibility'],
                    'status' => $post['status'],
                    'created_at' => now()->subDays($post['days_ago']),
                    'updated_at' => now()->subDays(max(0, $post['days_ago'] - 2)),
                ]
            );
        }
    }
}
