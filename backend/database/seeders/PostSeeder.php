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
        $students = User::where('email', 'like', 'student%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->toArray();

        if (! $admin || empty($students)) {
            return;
        }

        $channels = DB::table('channels')->pluck('id', 'slug');

        $posts = [
            [
                'user_id' => $admin->id,
                'channel' => 'thong-bao-clb',
                'title' => 'Chào mừng thành viên mới học kỳ 2/2026! 🎉',
                'content' => <<<'MD'
                Xin chào tất cả các thành viên!

                CLB IT CKC xin **chào mừng các bạn sinh viên mới** gia nhập trong học kỳ này. Chúng ta cùng nhau học hỏi, chia sẻ và phát triển kỹ năng công nghệ thông tin.

                ## Dành cho thành viên mới

                - 📌 Đọc *nội quy CLB* tại kênh Thông báo
                - 💬 Giới thiệu bản thân ở kênh **Góc chia sẻ**
                - 📅 Theo dõi lịch sinh hoạt tại mục **Sự kiện**
                - 🎓 Đăng ký khoá *Lập trình Web Cơ Bản* tại **Trung tâm học tập**

                > Đừng ngại đặt câu hỏi — tất cả chúng ta đều từng là người mới!

                Mong rằng mỗi thành viên sẽ tích cực tham gia các hoạt động của CLB và đóng góp cho cộng đồng. 💙
                MD,
                'media_urls' => ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=70'],
                'visibility' => 'public',
                'status' => 'published',
                'is_pinned' => true,
                'days_ago' => 30,
            ],
            [
                'user_id' => $admin->id,
                'channel' => 'su-kien-hoat-dong',
                'title' => 'Workshop: Nhập môn Machine Learning với Python',
                'content' => <<<'MD'
                CLB IT CKC tổ chức buổi workshop **Nhập môn Machine Learning với Python** 🤖

                | | |
                | --- | --- |
                | 📅 Thời gian | Thứ 7, 25/07/2026 — 08:30 |
                | 📍 Địa điểm | Phòng máy tính D402 |
                | 🎯 Đối tượng | Sinh viên yêu thích AI và dữ liệu |

                ## Nội dung chính

                1. Machine Learning là gì? Ứng dụng thực tế
                2. Các thuật toán cơ bản: *Linear Regression*, *KNN*
                3. Thực hành với `scikit-learn`
                4. Xây dựng mô hình dự đoán điểm số sinh viên

                > **Lưu ý:** Cần biết Python cơ bản. Đem theo laptop đã cài sẵn [Anaconda](https://www.anaconda.com/).

                Đăng ký tại mục **Sự kiện** trên website. Số lượng có hạn — 40 chỗ!
                MD,
                'media_urls' => ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=70'],
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 20,
            ],
            [
                'user_id' => $students[0],
                'channel' => 'lap-trinh-web',
                'title' => 'Tổng hợp tài nguyên học Web Development miễn phí cho người mới',
                'content' => <<<'MD'
                Mình tổng hợp một số tài nguyên học web development **miễn phí** mà chất lượng, ai mới bắt đầu nên lưu lại nhé 📚

                ## HTML / CSS / JavaScript

                - [The Odin Project](https://www.theodinproject.com/) — lộ trình fullstack hoàn chỉnh
                - [freeCodeCamp](https://www.freecodecamp.org/) — học qua bài tập tương tác
                - [MDN Web Docs](https://developer.mozilla.org/) — "từ điển" chuẩn nhất của web

                ## React

                - [React official docs](https://react.dev/) — docs mới rất dễ đọc
                - Scrimba React Course — học qua video tương tác

                ## Backend

                - [Laravel documentation](https://laravel.com/docs) — đọc docs là đủ giỏi
                - Node.js + Express tutorials trên YouTube

                > Kinh nghiệm của mình: **chọn 1 lộ trình rồi đi đến cùng**, đừng nhảy qua lại giữa các khoá học.

                Mọi người có thêm tài nguyên nào hay thì comment bên dưới nhé! 👇
                MD,
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 15,
            ],
            [
                'user_id' => $students[1] ?? $students[0],
                'channel' => 'cau-hoi-ho-tro',
                'title' => 'Hỏi về cách debug lỗi CORS trong dự án React + Laravel',
                'content' => <<<'MD'
                Mình đang làm đồ án với **React frontend** và **Laravel backend** nhưng bị lỗi CORS khi gọi API 😢

                Lỗi hiển thị trong console:

                ```
                Access to XMLHttpRequest at 'http://localhost:8000/api/users'
                from origin 'http://localhost:5173' has been blocked by CORS policy:
                No 'Access-Control-Allow-Origin' header is present.
                ```

                Mình đã thử cấu hình trong `config/cors.php`:

                ```php
                'paths' => ['api/*'],
                'allowed_origins' => ['*'],
                ```

                ...nhưng vẫn bị. Mọi người có gặp vấn đề này chưa và giải quyết như thế nào ạ? 🙏
                MD,
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 12,
            ],
            [
                'user_id' => $students[2] ?? $students[0],
                'channel' => 'goc-chia-se',
                'title' => 'Chia sẻ kinh nghiệm 3 tháng thực tập tại công ty phần mềm',
                'content' => <<<'MD'
                Mình vừa hoàn thành **3 tháng thực tập** tại một công ty phần mềm và muốn chia sẻ vài điều rút ra được:

                ## 1. Kỹ năng giao tiếp quan trọng không kém kỹ thuật

                Biết đặt câu hỏi đúng cách và báo cáo tiến độ rõ ràng giúp ích *rất nhiều*. Mentor không ngại bạn hỏi — họ ngại bạn im lặng rồi làm sai.

                ## 2. Git workflow là bắt buộc

                Học cách dùng `git branch`, tạo **pull request** và xử lý conflict *trước khi* đi thực tập. Ngày đầu tiên mình đã phải rebase — may mà có luyện trước ở CLB 😅

                ## 3. Đọc code người khác

                Phần lớn thời gian là **đọc và hiểu code có sẵn**, không phải viết mới. Kỹ năng đọc hiểu codebase lớn quan trọng hơn viết code nhanh.

                ## 4. Chủ động hỏi sau 30 phút bị kẹt

                > Quy tắc của mentor mình: "Tự tìm hiểu 30 phút. Chưa ra thì hỏi ngay, đừng để đến cuối ngày."

                Hy vọng hữu ích cho các bạn chuẩn bị đi thực tập! Ai có câu hỏi cứ comment nhé 💪
                MD,
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 8,
            ],
            [
                'user_id' => $students[3] ?? $students[0],
                'channel' => 'lap-trinh-web',
                'title' => 'Hướng dẫn cài đặt môi trường Docker cho dự án Laravel',
                'content' => <<<'MD'
                Setup Docker một lần, cả team hết cảnh *"máy tao chạy được mà máy mày không"* 🐳

                ## Các bước

                **Bước 1** — Cài [Docker Desktop](https://www.docker.com/products/docker-desktop/)

                **Bước 2** — Tạo `docker-compose.yml` với các service cần thiết:

                ```yaml
                services:
                  app:
                    build: .
                    volumes: ['.:/var/www/html']
                  nginx:
                    image: nginx:alpine
                    ports: ['8000:80']
                  mysql:
                    image: mysql:8
                    environment:
                      MYSQL_DATABASE: laravel
                      MYSQL_ROOT_PASSWORD: secret
                  redis:
                    image: redis:alpine
                ```

                **Bước 3** — Khởi động toàn bộ stack:

                ```bash
                docker compose up -d
                ```

                **Bước 4** — Vào container và setup Laravel:

                ```bash
                docker compose exec app composer install
                docker compose exec app php artisan migrate
                ```

                Xong! Ai cần file cấu hình đầy đủ thì comment, mình gửi repo mẫu cho nhé.
                MD,
                'visibility' => 'members',
                'status' => 'published',
                'days_ago' => 5,
            ],
            [
                'user_id' => $students[5] ?? $students[0],
                'channel' => 'lap-trinh-di-dong',
                'title' => 'Flutter hay React Native — chọn gì để bắt đầu học mobile năm 2026?',
                'content' => <<<'MD'
                Câu hỏi kinh điển của người mới học mobile 😄 Mình đã thử cả hai, đây là so sánh nhanh:

                | Tiêu chí | Flutter | React Native |
                | --- | --- | --- |
                | Ngôn ngữ | Dart | JavaScript/TypeScript |
                | Hiệu năng | Rất tốt (compile native) | Tốt |
                | UI | Widget tự vẽ, đồng nhất | Component native |
                | Cộng đồng VN | Đang tăng mạnh | Rất lớn |
                | Tận dụng kiến thức web | Ít | **Nhiều** (nếu biết React) |

                ## Kết luận của mình

                - Đã học **React** ở CLB rồi → chọn *React Native*, curve học gần như bằng 0
                - Bắt đầu từ đầu, muốn UI đẹp và mượt → chọn *Flutter*

                > Quan trọng nhất vẫn là **làm ra sản phẩm hoàn chỉnh**, framework chỉ là công cụ.

                Ai đang học Flutter thì kết nối với mình nhé, cùng làm project cho vui! 📱
                MD,
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 4,
            ],
            [
                'user_id' => $students[6] ?? $students[0],
                'channel' => 'goc-chia-se',
                'title' => 'Tặng mọi người bộ Figma UI Kit mình tự thiết kế 🎨',
                'content' => <<<'MD'
                Sau 2 tháng học UI/UX, mình đã hoàn thành bộ **UI Kit đầu tiên** dành cho ứng dụng quản lý học tập và muốn chia sẻ miễn phí cho cả CLB!

                ## Bộ kit gồm

                - 🎨 **Design tokens**: bảng màu, typography, spacing chuẩn
                - 🧩 40+ components: button, input, card, modal, navbar...
                - 📱 12 màn hình mẫu: đăng nhập, dashboard, hồ sơ...
                - 🌙 Hỗ trợ cả **light mode** và **dark mode**

                Link Figma mình để trong mục **Tài nguyên** của CLB nhé (đang chờ duyệt).

                > Feedback giúp mình với — đặc biệt là phần *màu sắc* và *độ tương phản*, mình muốn cải thiện khả năng accessibility. 🙏
                MD,
                'media_urls' => ['https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=70'],
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 3,
            ],
            [
                'user_id' => $admin->id,
                'channel' => 'thuc-tap',
                'title' => 'Tổng hợp tin tuyển thực tập sinh IT tháng 7/2026',
                'content' => <<<'MD'
                Ban Chủ nhiệm tổng hợp các tin tuyển **thực tập sinh** phù hợp với sinh viên trường mình 👇

                ## Backend / Fullstack

                - **FPT Software** — Thực tập sinh Java/PHP, *có trợ cấp*, deadline **20/07**
                - **KMS Technology** — Fresher & Intern .NET, yêu cầu tiếng Anh giao tiếp

                ## Frontend

                - **Tiki** — Intern Frontend (ReactJS), làm việc tại TP.HCM
                - **Haravan** — Thực tập sinh Web, ưu tiên biết *VueJS hoặc React*

                ## Tester / QA

                - **TMA Solutions** — Intern Tester, đào tạo từ đầu, nhận sinh viên năm 2–3

                ## Lưu ý khi ứng tuyển

                1. Đọc kỹ **JD** và điều chỉnh CV theo từng vị trí
                2. Portfolio GitHub gọn gàng — xem lại bài *Chuẩn bị hồ sơ thực tập IT* trên Blog CLB
                3. Cần người review CV? Đăng lên kênh **Câu hỏi & Hỗ trợ**, các anh chị sẽ giúp!

                > Chúc các bạn sớm tìm được vị trí phù hợp! 🍀
                MD,
                'visibility' => 'members',
                'status' => 'published',
                'days_ago' => 2,
            ],
            [
                'user_id' => $students[4] ?? $students[0],
                'channel' => 'su-kien-hoat-dong',
                'title' => 'Nhật ký Mùa hè xanh: một ngày đáng nhớ tại Trung tâm Bảo trợ xã hội 💚',
                'content' => <<<'MD'
                Hôm qua đội tình nguyện CLB đã có một ngày **thật sự ý nghĩa** tại Trung tâm Bảo trợ xã hội Quận 8.

                ## Những con số của ngày hôm đó

                - 👩‍🏫 **16 tình nguyện viên** tham gia
                - 💻 Dạy tin học cơ bản cho **25 em nhỏ**
                - 🔧 Sửa chữa và cài lại **12 máy tính** cho phòng học

                Khoảnh khắc đáng nhớ nhất là khi một em nhỏ lần đầu tự gõ được tên mình trong Word rồi quay sang cười tít mắt. Cảm giác kiến thức của mình *thực sự giúp được ai đó* — không gì vui bằng!

                > "Công nghệ chỉ có ý nghĩa khi nó chạm được đến mọi người." — khẩu hiệu chuyến đi của tụi mình.

                Cảm ơn Ban Tình nguyện đã tổ chức chuyến đi chu đáo. Hẹn gặp lại các em trong chuyến sau! 🌻
                MD,
                'media_urls' => [
                    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=70',
                    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1200&q=70',
                ],
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 2,
            ],
            [
                'user_id' => $students[8] ?? $students[0],
                'channel' => 'cau-hoi-ho-tro',
                'title' => 'Người mới học UI/UX nên bắt đầu từ đâu ạ?',
                'content' => <<<'MD'
                Chào mọi người, em là sinh viên năm nhất ngành Thiết kế. Em muốn theo hướng **UI/UX design** cho sản phẩm công nghệ nhưng đang khá mông lung 😅

                Em đang phân vân giữa mấy hướng:

                1. Học *Figma* thành thạo trước rồi mới học lý thuyết?
                2. Đọc sách design trước (mọi người hay nhắc *Don't Make Me Think*)?
                3. Học một ít **HTML/CSS** để hiểu developer làm việc thế nào?

                Anh chị nào đi trước cho em xin lộ trình với ạ. Em cảm ơn nhiều! 🙏
                MD,
                'visibility' => 'public',
                'status' => 'published',
                'days_ago' => 1,
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
                    'is_pinned' => $post['is_pinned'] ?? false,
                    'pinned_at' => ($post['is_pinned'] ?? false) ? now()->subDays($post['days_ago']) : null,
                    'created_at' => now()->subDays($post['days_ago']),
                    'updated_at' => now()->subDays(max(0, $post['days_ago'] - 1)),
                ]
            );
        }
    }
}
