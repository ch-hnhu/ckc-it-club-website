<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin) {
            return;
        }

        $tags = DB::table('tags')->pluck('id', 'slug');

        $blogs = [
            [
                'author_id'  => $admin->id,
                'title'      => 'Giới thiệu về CLB IT CKC – Nơi khởi nguồn đam mê công nghệ',
                'slug'       => 'gioi-thieu-clb-it-ckc',
                'excerpt'    => 'CLB IT CKC là tổ chức sinh viên tự nguyện tại Trường Cao đẳng Kỹ thuật Cao Thắng, được thành lập với mục tiêu tạo ra môi trường học tập, chia sẻ và phát triển kỹ năng công nghệ thông tin.',
                'content'    => "# CLB IT CKC – Câu lạc bộ Công nghệ thông tin Cao Thắng\n\nCLB IT CKC là tổ chức sinh viên tự nguyện tại Trường Cao đẳng Kỹ thuật Cao Thắng.\n\n## Sứ mệnh\n\nXây dựng cộng đồng sinh viên IT năng động, sáng tạo và hỗ trợ lẫn nhau trong hành trình học tập và phát triển sự nghiệp.\n\n## Các hoạt động chính\n\n- Workshop và seminar kỹ thuật\n- Cuộc thi lập trình nội bộ\n- Dự án mã nguồn mở\n- Kết nối thực tập và việc làm",
                'status'     => 'published',
                'days_ago'   => 60,
                'view_count' => 245,
                'tags'       => ['su-kien'],
            ],
            [
                'author_id'  => $students[0] ?? $admin->id,
                'title'      => 'Lộ trình học lập trình Web từ con số 0 đến có việc làm',
                'slug'       => 'lo-trinh-hoc-lap-trinh-web-tu-zero',
                'excerpt'    => 'Hướng dẫn chi tiết lộ trình học lập trình web cho người mới bắt đầu, từ HTML/CSS/JS cơ bản đến framework hiện đại và cách chuẩn bị portfolio xin việc.',
                'content'    => "# Lộ trình học Web Development 2025\n\n## Giai đoạn 1: Nền tảng (2–3 tháng)\n\n### HTML & CSS\n- Cấu trúc trang web cơ bản\n- CSS Flexbox/Grid\n- Responsive Design\n\n### JavaScript\n- Cú pháp cơ bản\n- DOM manipulation\n- Async/Await, Fetch API\n\n## Giai đoạn 2: Framework (3–4 tháng)\n\n### Frontend: React\n- Component-based architecture\n- State management\n- React Router\n\n### Backend: Laravel\n- RESTful API\n- Database (MySQL)\n- Authentication\n\n## Giai đoạn 3: Thực chiến (2–3 tháng)\n\n- Xây dựng 2–3 dự án cá nhân\n- Deploy lên Vercel/Railway\n- Tạo portfolio GitHub",
                'status'     => 'published',
                'days_ago'   => 20,
                'view_count' => 512,
                'tags'       => ['web-development', 'lap-trinh'],
            ],
            [
                'author_id'  => $students[1] ?? $admin->id,
                'title'      => 'Machine Learning cho sinh viên: Bắt đầu từ đâu?',
                'slug'       => 'machine-learning-cho-sinh-vien-bat-dau-tu-dau',
                'excerpt'    => 'Tổng quan về Machine Learning và hướng dẫn bắt đầu học ML cho sinh viên chuyên ngành CNTT, bao gồm các tài nguyên, công cụ và bước đầu thực hành.',
                'content'    => "# Machine Learning cho sinh viên CNTT\n\n## ML là gì?\n\nMachine Learning là một nhánh của AI cho phép máy tính học từ dữ liệu mà không cần lập trình tường minh.\n\n## Kiến thức cần có trước\n\n- **Toán học**: Đại số tuyến tính, Xác suất thống kê\n- **Python**: NumPy, Pandas\n\n## Lộ trình học ML\n\n1. Python cơ bản và thư viện khoa học dữ liệu\n2. Khóa Machine Learning của Andrew Ng (Coursera)\n3. Thực hành với Kaggle datasets\n4. Tìm hiểu Deep Learning\n\n## Công cụ phổ biến\n\n- **scikit-learn**: ML truyền thống\n- **TensorFlow/PyTorch**: Deep Learning\n- **Jupyter Notebook**: Môi trường thực hành",
                'status'     => 'published',
                'days_ago'   => 10,
                'view_count' => 328,
                'tags'       => ['ai-machine-learning', 'python'],
            ],
            [
                'author_id'  => $admin->id,
                'title'      => 'Kết quả Hackathon nội bộ CLB IT CKC 2025',
                'slug'       => 'ket-qua-hackathon-noi-bo-clb-it-ckc-2025',
                'excerpt'    => 'Tổng kết cuộc thi Hackathon nội bộ CLB IT CKC 2025 với chủ đề "Công nghệ vì cộng đồng".',
                'content'    => "# Hackathon CLB IT CKC 2025 – Tổng kết\n\n## Thông tin cuộc thi\n\n- **Chủ đề**: Công nghệ vì cộng đồng\n- **Thời gian**: 24 giờ liên tục\n- **Số đội tham dự**: 8 đội\n\n## Kết quả\n\n### Giải Nhất\n**Đội TechForGood** – Ứng dụng kết nối tình nguyện viên\n\n### Giải Nhì\n**Đội CodeCraft** – Hệ thống quản lý lịch học thông minh\n\n### Giải Ba\n**Đội ByteBuilders** – Chatbot hỗ trợ sinh viên",
                'status'     => 'published',
                'days_ago'   => 5,
                'view_count' => 189,
                'tags'       => ['hackathon', 'su-kien'],
            ],
            [
                'author_id'  => $students[2] ?? $admin->id,
                'title'      => 'Bảo mật ứng dụng web: Những lỗ hổng phổ biến cần tránh',
                'slug'       => 'bao-mat-ung-dung-web-nhung-lo-hong-pho-bien',
                'excerpt'    => 'Tìm hiểu về các lỗ hổng bảo mật web phổ biến trong OWASP Top 10 và cách phòng tránh chúng khi phát triển ứng dụng.',
                'content'    => "# Bảo mật Web: OWASP Top 10\n\n## 1. SQL Injection\n\nKẻ tấn công chèn mã SQL độc hại vào input của ứng dụng.\n\n**Phòng tránh**: Prepared Statements, ORM.\n\n## 2. XSS (Cross-Site Scripting)\n\nChèn script độc hại vào trang web.\n\n**Phòng tránh**: Escape output, Content Security Policy.\n\n## 3. CSRF\n\nBuộc người dùng thực hiện hành động không mong muốn.\n\n**Phòng tránh**: CSRF token, SameSite cookies.\n\n## 4. Broken Authentication\n\n**Phòng tránh**: 2FA, session timeout hợp lý.",
                'status'     => 'published',
                'days_ago'   => 3,
                'view_count' => 421,
                'tags'       => ['cybersecurity', 'web-development'],
            ],
            [
                'author_id'  => $students[3] ?? $admin->id,
                'title'      => 'Hướng dẫn xây dựng REST API với Laravel Sanctum',
                'slug'       => 'huong-dan-xay-dung-rest-api-voi-laravel-sanctum',
                'excerpt'    => 'Hướng dẫn từng bước xây dựng REST API có xác thực bằng Laravel Sanctum.',
                'content'    => "# REST API với Laravel Sanctum\n\n## Cài đặt\n\n```bash\ncomposer require laravel/sanctum\nphp artisan vendor:publish --provider=\"Laravel\\Sanctum\\SanctumServiceProvider\"\nphp artisan migrate\n```\n\n## Tạo API Authentication\n\nThêm `HasApiTokens` trait vào model User, sau đó:\n\n```php\npublic function register(Request \$request) {\n    \$user = User::create([...]);\n    return response()->json([\n        'token' => \$user->createToken('auth')->plainTextToken,\n    ]);\n}\n```\n\n## Bảo vệ route\n\n```php\nRoute::middleware('auth:sanctum')->group(function () {\n    Route::get('/user', fn(\$req) => \$req->user());\n});\n```",
                'status'     => 'pending_review',
                'days_ago'   => 1,
                'view_count' => 0,
                'tags'       => ['web-development', 'lap-trinh'],
            ],
        ];

        foreach ($blogs as $blog) {
            if (DB::table('blogs')->where('slug', $blog['slug'])->exists()) {
                continue;
            }

            $daysAgo  = $blog['days_ago'];
            $blogTags = $blog['tags'];

            $blogId = DB::table('blogs')->insertGetId([
                'author_id'    => $blog['author_id'],
                'title'        => $blog['title'],
                'slug'         => $blog['slug'],
                'content'      => $blog['content'],
                'excerpt'      => $blog['excerpt'],
                'cover_image'  => null,
                'status'       => $blog['status'],
                'published_at' => $blog['status'] === 'published' ? now()->subDays($daysAgo) : null,
                'view_count'   => $blog['view_count'],
                'created_at'   => now()->subDays($daysAgo + 1),
                'updated_at'   => now()->subDays(max(0, $daysAgo - 1)),
            ]);

            foreach ($blogTags as $tagSlug) {
                $tagId = $tags[$tagSlug] ?? null;
                if ($tagId) {
                    DB::table('blog_tags')->insertOrIgnore([
                        'blog_id'    => $blogId,
                        'tag_id'     => $tagId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
