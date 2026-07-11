<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin) {
            return;
        }

        $tags = DB::table('tags')->pluck('id', 'slug');

        $blogs = [
            [
                'author_id' => $admin->id,
                'title' => 'Giới thiệu: Bảng xếp hạng',
                'slug' => 'gioi-thieu-bang-xep-hang',
                'excerpt' => 'Tìm hiểu cách bảng xếp hạng, XP và rank giúp thành viên CKC IT Club theo dõi quá trình đóng góp, học tập và thi đua trong cộng đồng.',
                'content' => "# Giới thiệu: Bảng xếp hạng CKC IT Club\n\nBảng xếp hạng là nơi tổng hợp điểm hoạt động của thành viên trong cộng đồng CKC IT Club. Mỗi hành động có giá trị như đăng bài chất lượng, viết blog chia sẻ kiến thức, tham gia thảo luận hoặc hỗ trợ bạn khác đều có thể giúp bạn tích lũy XP.\n\n## XP dùng để làm gì?\n\nXP phản ánh mức độ tham gia và đóng góp của bạn trong cộng đồng. Khi tổng điểm tăng lên, hệ thống sẽ tự động xếp bạn vào các rank như Đồng, Bạc, Vàng, Bạch Kim, Kim Cương và Tinh Anh. Rank không chỉ là huy hiệu hiển thị trên hồ sơ, mà còn là cách ghi nhận hành trình học tập và chia sẻ của từng thành viên.\n\n## Cách bảng xếp hạng hoạt động\n\nBảng xếp hạng có hai chế độ: theo tuần và mọi thời điểm. Chế độ theo tuần giúp các thành viên mới vẫn có cơ hội nổi bật nếu hoạt động đều đặn, còn chế độ mọi thời điểm thể hiện tổng đóng góp dài hạn. Điểm được cập nhật từ các hoạt động thật trong hệ thống, vì vậy hãy ưu tiên nội dung hữu ích, tôn trọng cộng đồng và hỗ trợ nhau cùng tiến bộ.\n\n## Mẹo tăng hạng\n\n- Viết bài chia sẻ kinh nghiệm học tập hoặc làm dự án.\n- Bình luận có giá trị, đặt câu hỏi rõ ràng và phản hồi lịch sự.\n- Tham gia thử thách, sự kiện và các hoạt động của CLB.\n- Duy trì thói quen đóng góp đều đặn thay vì chỉ hoạt động một lần.\n\nHãy xem bảng xếp hạng như một động lực nhỏ để học tốt hơn, kết nối nhiều hơn và cùng xây dựng cộng đồng CKC IT Club tích cực.",
                'cover_image' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 1,
                'view_count' => 86,
                'tags' => ['lap-trinh', 'su-kien'],
            ],
            [
                'author_id' => $admin->id,
                'title' => 'Giới thiệu về CLB IT CKC – Nơi khởi nguồn đam mê công nghệ',
                'slug' => 'gioi-thieu-clb-it-ckc',
                'excerpt' => 'CLB IT CKC là tổ chức sinh viên tự nguyện tại Trường Cao đẳng Kỹ thuật Cao Thắng, được thành lập với mục tiêu tạo ra môi trường học tập, chia sẻ và phát triển kỹ năng công nghệ thông tin.',
                'content' => "# CLB IT CKC – Câu lạc bộ Công nghệ thông tin Cao Thắng\n\nCLB IT CKC là tổ chức sinh viên tự nguyện tại Trường Cao đẳng Kỹ thuật Cao Thắng.\n\n## Sứ mệnh\n\nXây dựng cộng đồng sinh viên IT năng động, sáng tạo và hỗ trợ lẫn nhau trong hành trình học tập và phát triển sự nghiệp.\n\n## Các hoạt động chính\n\n- Workshop và seminar kỹ thuật\n- Cuộc thi lập trình nội bộ\n- Dự án mã nguồn mở\n- Kết nối thực tập và việc làm",
                'cover_image' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 60,
                'view_count' => 245,
                'is_pinned' => true,
                'is_highlight' => true,
                'tags' => ['su-kien'],
            ],
            [
                'author_id' => $students[0] ?? $admin->id,
                'title' => 'Lộ trình học lập trình Web từ con số 0 đến có việc làm',
                'slug' => 'lo-trinh-hoc-lap-trinh-web-tu-zero',
                'excerpt' => 'Hướng dẫn chi tiết lộ trình học lập trình web cho người mới bắt đầu, từ HTML/CSS/JS cơ bản đến framework hiện đại và cách chuẩn bị portfolio xin việc.',
                'content' => "# Lộ trình học Web Development 2025\n\n## Giai đoạn 1: Nền tảng (2–3 tháng)\n\n### HTML & CSS\n- Cấu trúc trang web cơ bản\n- CSS Flexbox/Grid\n- Responsive Design\n\n### JavaScript\n- Cú pháp cơ bản\n- DOM manipulation\n- Async/Await, Fetch API\n\n## Giai đoạn 2: Framework (3–4 tháng)\n\n### Frontend: React\n- Component-based architecture\n- State management\n- React Router\n\n### Backend: Laravel\n- RESTful API\n- Database (MySQL)\n- Authentication\n\n## Giai đoạn 3: Thực chiến (2–3 tháng)\n\n- Xây dựng 2–3 dự án cá nhân\n- Deploy lên Vercel/Railway\n- Tạo portfolio GitHub",
                'cover_image' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 20,
                'view_count' => 512,
                'is_highlight' => true,
                'tags' => ['web-development', 'lap-trinh'],
            ],
            [
                'author_id' => $students[1] ?? $admin->id,
                'title' => 'Machine Learning cho sinh viên: Bắt đầu từ đâu?',
                'slug' => 'machine-learning-cho-sinh-vien-bat-dau-tu-dau',
                'excerpt' => 'Tổng quan về Machine Learning và hướng dẫn bắt đầu học ML cho sinh viên chuyên ngành CNTT, bao gồm các tài nguyên, công cụ và bước đầu thực hành.',
                'content' => "# Machine Learning cho sinh viên CNTT\n\n## ML là gì?\n\nMachine Learning là một nhánh của AI cho phép máy tính học từ dữ liệu mà không cần lập trình tường minh.\n\n## Kiến thức cần có trước\n\n- **Toán học**: Đại số tuyến tính, Xác suất thống kê\n- **Python**: NumPy, Pandas\n\n## Lộ trình học ML\n\n1. Python cơ bản và thư viện khoa học dữ liệu\n2. Khóa Machine Learning của Andrew Ng (Coursera)\n3. Thực hành với Kaggle datasets\n4. Tìm hiểu Deep Learning\n\n## Công cụ phổ biến\n\n- **scikit-learn**: ML truyền thống\n- **TensorFlow/PyTorch**: Deep Learning\n- **Jupyter Notebook**: Môi trường thực hành",
                'cover_image' => 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 10,
                'view_count' => 328,
                'tags' => ['ai-machine-learning', 'python'],
            ],
            [
                'author_id' => $admin->id,
                'title' => 'Kết quả Hackathon nội bộ CLB IT CKC 2025',
                'slug' => 'ket-qua-hackathon-noi-bo-clb-it-ckc-2025',
                'excerpt' => 'Tổng kết cuộc thi Hackathon nội bộ CLB IT CKC 2025 với chủ đề "Công nghệ vì cộng đồng".',
                'content' => "# Hackathon CLB IT CKC 2025 – Tổng kết\n\n## Thông tin cuộc thi\n\n- **Chủ đề**: Công nghệ vì cộng đồng\n- **Thời gian**: 24 giờ liên tục\n- **Số đội tham dự**: 8 đội\n\n## Kết quả\n\n### Giải Nhất\n**Đội TechForGood** – Ứng dụng kết nối tình nguyện viên\n\n### Giải Nhì\n**Đội CodeCraft** – Hệ thống quản lý lịch học thông minh\n\n### Giải Ba\n**Đội ByteBuilders** – Chatbot hỗ trợ sinh viên",
                'cover_image' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 5,
                'view_count' => 189,
                'tags' => ['hackathon', 'su-kien'],
            ],
            [
                'author_id' => $students[2] ?? $admin->id,
                'title' => 'Bảo mật ứng dụng web: Những lỗ hổng phổ biến cần tránh',
                'slug' => 'bao-mat-ung-dung-web-nhung-lo-hong-pho-bien',
                'excerpt' => 'Tìm hiểu về các lỗ hổng bảo mật web phổ biến trong OWASP Top 10 và cách phòng tránh chúng khi phát triển ứng dụng.',
                'content' => "# Bảo mật Web: OWASP Top 10\n\n## 1. SQL Injection\n\nKẻ tấn công chèn mã SQL độc hại vào input của ứng dụng.\n\n**Phòng tránh**: Prepared Statements, ORM.\n\n## 2. XSS (Cross-Site Scripting)\n\nChèn script độc hại vào trang web.\n\n**Phòng tránh**: Escape output, Content Security Policy.\n\n## 3. CSRF\n\nBuộc người dùng thực hiện hành động không mong muốn.\n\n**Phòng tránh**: CSRF token, SameSite cookies.\n\n## 4. Broken Authentication\n\n**Phòng tránh**: 2FA, session timeout hợp lý.",
                'cover_image' => 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 3,
                'view_count' => 421,
                'is_highlight' => true,
                'tags' => ['cybersecurity', 'web-development'],
            ],
            [
                'author_id' => $students[3] ?? $admin->id,
                'title' => 'Hướng dẫn xây dựng REST API với Laravel Sanctum',
                'slug' => 'huong-dan-xay-dung-rest-api-voi-laravel-sanctum',
                'excerpt' => 'Hướng dẫn từng bước xây dựng REST API có xác thực bằng Laravel Sanctum.',
                'content' => "# REST API với Laravel Sanctum\n\n## Cài đặt\n\n```bash\ncomposer require laravel/sanctum\nphp artisan vendor:publish --provider=\"Laravel\\Sanctum\\SanctumServiceProvider\"\nphp artisan migrate\n```\n\n## Tạo API Authentication\n\nThêm `HasApiTokens` trait vào model User, sau đó:\n\n```php\npublic function register(Request \$request) {\n    \$user = User::create([...]);\n    return response()->json([\n        'token' => \$user->createToken('auth')->plainTextToken,\n    ]);\n}\n```\n\n## Bảo vệ route\n\n```php\nRoute::middleware('auth:sanctum')->group(function () {\n    Route::get('/user', fn(\$req) => \$req->user());\n});\n```",
                'cover_image' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=70',
                'status' => 'pending_review',
                'days_ago' => 1,
                'view_count' => 0,
                'tags' => ['web-development', 'lap-trinh'],
            ],

            // ── 5 blog bổ sung ────────────────────────────────────────────────
            [
                'author_id' => $students[0] ?? $admin->id,
                'title' => 'Docker cho người mới: Container hoá ứng dụng trong 30 phút',
                'slug' => 'docker-cho-nguoi-moi-container-hoa-ung-dung',
                'excerpt' => 'Hướng dẫn thực hành Docker từ đầu — cài đặt, tạo Dockerfile, chạy container và quản lý image — dành cho sinh viên chưa từng dùng Docker.',
                'content' => "# Docker cho người mới bắt đầu\n\nDocker giúp đóng gói ứng dụng cùng toàn bộ dependencies vào một **container** di động, chạy nhất quán trên mọi môi trường.\n\n## Tại sao cần Docker?\n\n- \"Chạy được trên máy mình\" không còn là vấn đề\n- Triển khai nhanh, rollback dễ\n- Tách biệt môi trường dev / staging / production\n\n## Cài đặt\n\nTải Docker Desktop tại [docker.com](https://docker.com) và kiểm tra:\n\n```bash\ndocker --version\n```\n\n## Dockerfile cơ bản\n\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]\n```\n\n## Các lệnh hay dùng\n\n```bash\n# Build image\ndocker build -t my-app .\n\n# Chạy container\ndocker run -p 3000:3000 my-app\n\n# Xem container đang chạy\ndocker ps\n\n# Dừng container\ndocker stop <id>\n```\n\n## Docker Compose\n\nKhi cần nhiều service (app + database):\n\n```yaml\nservices:\n  app:\n    build: .\n    ports: [\"3000:3000\"]\n    depends_on: [db]\n  db:\n    image: mysql:8\n    environment:\n      MYSQL_ROOT_PASSWORD: secret\n      MYSQL_DATABASE: myapp\n```\n\nChạy toàn bộ stack:\n\n```bash\ndocker compose up -d\n```\n\n## Kết luận\n\nDocker là kỹ năng không thể thiếu trong môi trường DevOps và cloud hiện đại. Hãy bắt đầu container hoá project của bạn ngay hôm nay!",
                'cover_image' => 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 14,
                'view_count' => 374,
                'tags' => ['devops', 'lap-trinh'],
            ],
            [
                'author_id' => $students[1] ?? $admin->id,
                'title' => 'Git Flow cho nhóm: Làm việc nhóm hiệu quả với Git',
                'slug' => 'git-flow-lam-viec-nhom-hieu-qua',
                'excerpt' => 'Chiến lược quản lý nhánh Git trong dự án nhóm: Git Flow, GitHub Flow, quy tắc commit message và cách giải quyết conflict.',
                'content' => "# Git Flow – Làm việc nhóm không còn loạn\n\nLàm dự án nhóm mà mỗi người push lên `main` là... thảm hoạ. Git Flow giải quyết vấn đề đó.\n\n## Mô hình nhánh\n\n| Nhánh | Mục đích |\n|---|---|\n| `main` | Code production ổn định |\n| `develop` | Tích hợp tính năng mới |\n| `feature/*` | Phát triển từng tính năng |\n| `hotfix/*` | Vá lỗi khẩn trên production |\n\n## Quy trình làm tính năng mới\n\n```bash\n# Tạo nhánh tính năng từ develop\ngit checkout develop\ngit checkout -b feature/login-page\n\n# Làm xong, merge về develop\ngit checkout develop\ngit merge feature/login-page\ngit branch -d feature/login-page\n```\n\n## Commit message chuẩn\n\nDùng **Conventional Commits**:\n\n```\nfeat: thêm tính năng đăng nhập Google\nfix: sửa lỗi validate email\ndocs: cập nhật README\nrefactor: tách component Header\n```\n\n## Giải quyết conflict\n\n```bash\n# Khi merge bị conflict\ngit status            # xem file bị conflict\n# Mở file, chỉnh sửa đoạn <<<< ==== >>>>\ngit add .\ngit commit -m \"resolve: merge conflict login page\"\n```\n\n## Pull Request (PR)\n\n- Tạo PR từ `feature/*` vào `develop`\n- Yêu cầu ít nhất 1 reviewer approve\n- Squash merge để giữ lịch sử sạch\n\nÁp dụng đúng Git Flow, team bạn sẽ không bao giờ hỏi nhau \"code của mày đâu rồi?\" nữa.",
                'cover_image' => 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 8,
                'view_count' => 296,
                'tags' => ['lap-trinh', 'workshop'],
            ],
            [
                'author_id' => $students[2] ?? $admin->id,
                'title' => 'Xây dựng ứng dụng di động đầu tay với Flutter',
                'slug' => 'xay-dung-ung-dung-di-dong-voi-flutter',
                'excerpt' => 'Flutter là framework của Google giúp xây dựng ứng dụng iOS và Android từ một codebase duy nhất bằng ngôn ngữ Dart. Bắt đầu từ zero nhé!',
                'content' => "# Flutter – Một code, chạy khắp nơi\n\nFlutter cho phép bạn viết **một lần**, chạy trên iOS, Android, Web và Desktop.\n\n## Cài đặt\n\n1. Tải Flutter SDK: [flutter.dev](https://flutter.dev)\n2. Thêm vào PATH\n3. Kiểm tra: `flutter doctor`\n\n## Cấu trúc project\n\n```\nlib/\n  main.dart          # Entry point\n  screens/           # Màn hình\n  widgets/           # Component tái sử dụng\n  services/          # Gọi API\n  models/            # Data models\n```\n\n## Hello World Flutter\n\n```dart\nimport 'package:flutter/material.dart';\n\nvoid main() => runApp(const MyApp());\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      home: Scaffold(\n        appBar: AppBar(title: const Text('CLB IT CKC')),\n        body: const Center(child: Text('Xin chào Flutter!')),\n      ),\n    );\n  }\n}\n```\n\n## Widget thông dụng\n\n| Widget | Dùng cho |\n|---|---|\n| `Text` | Hiển thị văn bản |\n| `Column` / `Row` | Bố cục dọc / ngang |\n| `Container` | Box model |\n| `ListView` | Danh sách cuộn |\n| `ElevatedButton` | Nút bấm |\n\n## State Management\n\nBắt đầu với **setState**, sau đó học **Provider** hoặc **Riverpod** khi app phức tạp hơn.\n\nFlutter là lựa chọn tuyệt vời nếu bạn muốn học mobile dev mà không cần biết Swift hay Kotlin.",
                'cover_image' => 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 6,
                'view_count' => 441,
                'tags' => ['mobile-app', 'lap-trinh'],
            ],
            [
                'author_id' => $students[3] ?? $admin->id,
                'title' => 'Tối ưu truy vấn SQL: Từ chậm rùa đến nhanh như gió',
                'slug' => 'toi-uu-truy-van-sql-tu-cham-den-nhanh',
                'excerpt' => 'Những kỹ thuật tối ưu hoá câu truy vấn SQL phổ biến: index, EXPLAIN, tránh N+1, và cách đọc execution plan.',
                'content' => "# Tối ưu SQL – Kỹ năng bắt buộc của Backend Developer\n\nQuery chậm là nguyên nhân hàng đầu khiến ứng dụng lag. Hãy cùng \"mổ\" vấn đề này.\n\n## EXPLAIN – Công cụ chẩn đoán\n\n```sql\nEXPLAIN SELECT * FROM users\nWHERE email = 'test@gmail.com';\n```\n\nChú ý cột `type`: `ALL` = quét toàn bảng (tệ), `ref` / `eq_ref` = dùng index (tốt).\n\n## Index – Vũ khí số 1\n\n```sql\n-- Tạo index trên cột hay WHERE/JOIN/ORDER BY\nCREATE INDEX idx_users_email ON users(email);\n\n-- Composite index cho query nhiều cột\nCREATE INDEX idx_posts_user_status ON posts(user_id, status);\n```\n\n**Lưu ý**: Index tốn dung lượng và làm chậm INSERT/UPDATE — chỉ tạo khi cần.\n\n## Tránh N+1 Query\n\n```php\n// Tệ: N+1 (1 query lấy posts + N query lấy user)\n\$posts = Post::all();\nforeach (\$posts as \$post) {\n    echo \$post->user->name; // query mới mỗi lần!\n}\n\n// Tốt: Eager loading\n\$posts = Post::with('user')->get();\n```\n\n## Các tips khác\n\n- **SELECT \\*** vs chỉ lấy cột cần thiết\n- Dùng **LIMIT** với dữ liệu lớn\n- Tránh function trong WHERE: `WHERE YEAR(created_at) = 2025` sẽ không dùng index\n- Cache kết quả query với Redis nếu dữ liệu ít thay đổi\n\nMột query tốt có thể giảm response time từ 2 giây xuống còn 20ms.",
                'cover_image' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 4,
                'view_count' => 318,
                'tags' => ['database', 'web-development'],
            ],
            [
                'author_id' => $admin->id,
                'title' => 'Chuẩn bị hồ sơ thực tập IT: Checklist từ A đến Z',
                'slug' => 'chuan-bi-ho-so-thuc-tap-it-checklist',
                'excerpt' => 'Hướng dẫn toàn diện giúp sinh viên IT chuẩn bị CV, portfolio GitHub, và cách vượt qua vòng phỏng vấn technical để có suất thực tập mơ ước.',
                'content' => "# Chuẩn bị hồ sơ thực tập IT – Checklist đầy đủ\n\nThực tập là bước đệm quan trọng nhất trong sự nghiệp IT. Chuẩn bị tốt ngay từ năm 2–3.\n\n## CV (Curriculum Vitae)\n\n### Cấu trúc chuẩn\n1. **Thông tin cá nhân** – tên, email, phone, LinkedIn, GitHub\n2. **Tóm tắt** – 2–3 câu về bản thân và định hướng\n3. **Kỹ năng** – ngôn ngữ, framework, tool\n4. **Dự án** – 2–3 project nổi bật (link GitHub/demo)\n5. **Học vấn** – trường, chuyên ngành, GPA (nếu ≥ 3.0)\n\n### Tips viết CV\n- **Một trang** là đủ cho sinh viên\n- Dùng động từ hành động: *Xây dựng*, *Tối ưu*, *Thiết kế*\n- Ghi kết quả cụ thể: \"Giảm load time 40%\" thay vì \"Cải thiện hiệu năng\"\n\n## GitHub Portfolio\n\n✅ Profile README nổi bật\n✅ Ít nhất 3 project có README rõ ràng\n✅ Commit đều đặn (contribution graph xanh)\n✅ Không để project chỉ có file khởi tạo\n\n## Phỏng vấn Technical\n\n### Chuẩn bị\n- Ôn **Data Structures & Algorithms** cơ bản (LeetCode Easy)\n- Hiểu rõ các project trong CV của mình\n- Chuẩn bị câu hỏi ngược lại cho nhà tuyển dụng\n\n### Câu hỏi thường gặp\n- Giải thích OOP / SOLID\n- Sự khác nhau giữa REST và GraphQL\n- Cách bạn debug một bug khó\n\n## Timeline khuyến nghị\n\n| Thời điểm | Việc cần làm |\n|---|---|\n| 3 tháng trước | Hoàn thiện GitHub, cập nhật CV |\n| 2 tháng trước | Nộp hồ sơ, luyện leetcode |\n| 1 tháng trước | Mock interview, nghiên cứu công ty |\n\nĐừng đợi đến năm cuối mới lo thực tập — bắt đầu từ hôm nay!",
                'cover_image' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70',
                'status' => 'published',
                'days_ago' => 2,
                'view_count' => 507,
                'is_highlight' => true,
                'tags' => ['thuc-tap', 'su-kien'],
            ],
        ];

        foreach ($blogs as $blog) {
            if (DB::table('blogs')->where('slug', $blog['slug'])->exists()) {
                continue;
            }

            $daysAgo = $blog['days_ago'];
            $blogTags = $blog['tags'];

            $blogId = DB::table('blogs')->insertGetId([
                'author_id' => $blog['author_id'],
                'title' => $blog['title'],
                'slug' => $blog['slug'],
                'content' => $blog['content'],
                'excerpt' => $blog['excerpt'],
                'cover_image' => $blog['cover_image'] ?? null,
                'status' => $blog['status'],
                'published_at' => $blog['status'] === 'published' ? now()->subDays($daysAgo) : null,
                'view_count' => $blog['view_count'],
                'is_pinned' => $blog['is_pinned'] ?? false,
                'pinned_at' => ($blog['is_pinned'] ?? false) ? now()->subDays($daysAgo) : null,
                'is_highlight' => $blog['is_highlight'] ?? false,
                'created_at' => now()->subDays($daysAgo + 1),
                'updated_at' => now()->subDays(max(0, $daysAgo - 1)),
            ]);

            foreach ($blogTags as $tagSlug) {
                $tagId = $tags[$tagSlug] ?? null;
                if ($tagId) {
                    DB::table('blog_tags')->insertOrIgnore([
                        'blog_id' => $blogId,
                        'tag_id' => $tagId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
