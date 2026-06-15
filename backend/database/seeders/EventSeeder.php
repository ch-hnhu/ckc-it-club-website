<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventFeedback;
use App\Models\EventGalleryItem;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        if (! $admin) {
            return;
        }

        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        $hocThuat   = Department::where('slug', 'hoc-thuat')->first();
        $truyenThong = Department::where('slug', 'truyen-thong')->first();
        $tinhNguyen = Department::where('slug', 'tinh-nguyen')->first();

        $events = [
            // ── Sắp diễn ra ──────────────────────────────────────────────
            [
                'title'         => 'Workshop: Xây dựng REST API với Laravel',
                'description'   => 'Buổi workshop hướng dẫn thực hành xây dựng REST API hoàn chỉnh với Laravel, Sanctum và best practices khi thiết kế endpoint.',
                'content'       => <<<'MD'
                ## Giới thiệu

                Buổi workshop giúp bạn nắm vững quy trình xây dựng **REST API hoàn chỉnh** với Laravel — từ thiết kế database đến bảo mật endpoint theo *best practices*.

                ## Lịch trình

                | Thời gian | Nội dung |
                | --- | --- |
                | 09:00 – 09:30 | Tổng quan kiến trúc RESTful API |
                | 09:30 – 10:15 | Thiết kế database & migration |
                | 10:15 – 11:00 | Xác thực với Laravel Sanctum |
                | 11:00 – 11:30 | Thực hành CRUD API + Q&A |

                ## Chuẩn bị

                Cài sẵn môi trường trước khi tham gia:

                ```bash
                composer create-project laravel/laravel rest-api-demo
                cd rest-api-demo
                php artisan serve
                ```

                > **Lưu ý:** Sinh viên cần có kiến thức cơ bản về PHP và đem theo laptop cá nhân.

                Tài liệu tham khảo: [Laravel Documentation](https://laravel.com/docs)
                MD,
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+5 days 09:00',
                'end_offset'    => '+5 days 11:30',
                'location'      => 'Phòng A305, Trường Cao đẳng Kỹ thuật Cao Thắng',
                'max_attendees' => 50,
                'is_members_only' => false,
                'status'        => 'published',
                'registrations' => 8,
            ],
            [
                'title'         => 'Cuộc thi Hackathon CKC 2026',
                'description'   => 'Sân chơi lập trình lớn nhất năm dành cho sinh viên đam mê công nghệ với chủ đề "Công nghệ vì cộng đồng".',
                'content'       => <<<'MD'
                ## Thể lệ

                1. Mỗi đội từ **3–5 thành viên**, là sinh viên đang theo học tại trường.
                2. Thời gian thi: **24 giờ liên tục**.
                3. Sản phẩm phải được xây dựng *hoàn toàn trong thời gian thi*.
                4. Chủ đề năm nay: **Công nghệ vì cộng đồng**.

                ## Giải thưởng

                | Giải | Phần thưởng |
                | --- | --- |
                | Giải Nhất | 5.000.000đ + Giấy khen |
                | Giải Nhì | 3.000.000đ |
                | Giải Ba | 2.000.000đ |
                | Ấn tượng | 500.000đ |

                ## Tiêu chí chấm điểm

                - Tính sáng tạo và ý nghĩa cộng đồng — `40%`
                - Mức độ hoàn thiện sản phẩm — `30%`
                - Công nghệ sử dụng — `20%`
                - Thuyết trình — `10%`

                > Đăng ký sớm để giữ chỗ — số lượng đội thi có hạn!
                MD,
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+12 days 08:00',
                'end_offset'    => '+13 days 17:00',
                'location'      => 'Hội trường lớn',
                'max_attendees' => 100,
                'is_members_only' => false,
                'status'        => 'published',
                'registrations' => 15,
            ],
            [
                'title'         => 'Talkshow: Định hướng nghề nghiệp ngành IT',
                'description'   => 'Trò chuyện cùng các anh chị cựu sinh viên đang làm việc tại các công ty công nghệ về kinh nghiệm xin việc và phát triển sự nghiệp.',
                'content'       => <<<'MD'
                ## Diễn giả

                Các **cựu sinh viên CLB IT CKC** hiện đang công tác tại:

                - *FPT Software* — Senior Backend Developer
                - *VNG* — Product Engineer
                - *Tiki* — Data Engineer

                ## Chủ đề thảo luận

                1. Chuẩn bị hồ sơ xin việc và CV gây ấn tượng
                2. Kinh nghiệm phỏng vấn vị trí thực tập
                3. Lộ trình phát triển **Junior → Senior**

                > "Điều quan trọng nhất khi mới ra trường không phải là biết nhiều công nghệ, mà là thái độ học hỏi." — trích chia sẻ từ diễn giả mùa trước.

                Người tham dự được **đặt câu hỏi trực tiếp** trong phần giao lưu cuối chương trình.
                MD,
                'department_id' => $truyenThong?->id,
                'start_offset'  => '+20 days 14:00',
                'end_offset'    => '+20 days 16:30',
                'location'      => 'Hội trường B, Cơ sở 2',
                'max_attendees' => null,
                'is_members_only' => false,
                'status'        => 'published',
                'registrations' => 5,
            ],

            // ── Đang diễn ra ──────────────────────────────────────────────
            [
                'title'         => 'Buổi sinh hoạt CLB tháng 6',
                'description'   => 'Tổng kết hoạt động tháng và giao lưu giữa các thành viên CLB IT CKC.',
                'content'       => <<<'MD'
                ## Nội dung buổi sinh hoạt

                - Tổng kết hoạt động **tháng 6** của các ban
                - Giới thiệu *thành viên mới* gia nhập CLB
                - Mini game & giao lưu giữa các ban

                > Buổi sinh hoạt mở cửa tự do cho mọi thành viên, không cần đăng ký trước.
                MD,
                'department_id' => null,
                'start_offset'  => '-1 hours',
                'end_offset'    => '+2 hours',
                'location'      => 'Phòng sinh hoạt CLB',
                'max_attendees' => null,
                'is_members_only' => true,
                'status'        => 'ongoing',
                'registrations' => 0,
            ],

            // ── Đã kết thúc (có điểm danh + đánh giá) ───────────────────────
            [
                'title'         => 'Workshop: Giới thiệu Git & GitHub cho người mới',
                'description'   => 'Buổi workshop nhập môn Git và GitHub dành cho tân sinh viên, hướng dẫn quy trình làm việc nhóm cơ bản.',
                'content'       => <<<'MD'
                ## Nội dung

                1. Cài đặt Git và cấu hình ban đầu
                2. Các lệnh Git cơ bản: `init`, `add`, `commit`, `push`
                3. Làm việc nhóm với GitHub
                4. Thực hành tạo **Pull Request** đầu tiên

                ## Lệnh cơ bản sẽ thực hành

                ```bash
                git init
                git add .
                git commit -m "First commit"
                git remote add origin https://github.com/username/repo.git
                git push -u origin main
                ```

                > Tân sinh viên chưa từng dùng Git vẫn theo kịp — workshop hướng dẫn từ con số 0.
                MD,
                'department_id' => $hocThuat?->id,
                'start_offset'  => '-10 days 09:00',
                'end_offset'    => '-10 days 11:00',
                'location'      => 'Phòng A305',
                'max_attendees' => 40,
                'is_members_only' => false,
                'status'        => 'ended',
                'registrations' => 12,
                'check_ins'     => 9,
                'feedbacks'     => 7,
                'gallery'       => 6,
            ],
            [
                'title'         => 'Chiến dịch Tình nguyện mùa hè xanh 2026',
                'description'   => 'Hoạt động tình nguyện hỗ trợ cộng đồng, dạy tin học miễn phí cho trẻ em tại trung tâm bảo trợ xã hội.',
                'content'       => <<<'MD'
                ## Hoạt động

                - Dạy **tin học cơ bản** cho trẻ em tại trung tâm
                - Sửa chữa, cài đặt lại *thiết bị máy tính cũ*
                - Trao quà và giao lưu văn nghệ cùng các em

                ## Lịch trình trong ngày

                | Thời gian | Hoạt động |
                | --- | --- |
                | 07:00 | Tập trung, di chuyển đến trung tâm |
                | 08:00 – 11:00 | Dạy tin học & sửa máy tính |
                | 13:30 – 16:00 | Giao lưu văn nghệ, trao quà |
                | 17:00 | Tổng kết, trở về trường |

                > Tình nguyện viên được CLB hỗ trợ chi phí di chuyển và ăn trưa.
                MD,
                'department_id' => $tinhNguyen?->id,
                'start_offset'  => '-3 days 07:00',
                'end_offset'    => '-3 days 17:00',
                'location'      => 'Trung tâm Bảo trợ xã hội Quận 8',
                'max_attendees' => 30,
                'is_members_only' => false,
                'status'        => 'ended',
                'registrations' => 18,
                'check_ins'     => 16,
                'feedbacks'     => 11,
                'gallery'       => 8,
            ],

            // ── Bản nháp & đã hủy ────────────────────────────────────────────
            [
                'title'         => 'Cuộc thi thiết kế UI/UX CKC Design Challenge',
                'description'   => 'Cuộc thi thiết kế giao diện ứng dụng dành cho sinh viên yêu thích UI/UX. Đang trong giai đoạn lên kế hoạch.',
                'content'       => <<<'MD'
                ## Ý tưởng (bản nháp)

                Cuộc thi thiết kế giao diện ứng dụng dành cho sinh viên yêu thích **UI/UX**.

                ## Dự kiến thể lệ

                - Thi cá nhân hoặc đội tối đa *2 thành viên*
                - Đề bài công bố ngay tại sự kiện
                - Công cụ: Figma hoặc bất kỳ công cụ thiết kế nào

                > TODO: chốt danh sách giám khảo và cơ cấu giải thưởng trước khi đăng.
                MD,
                'department_id' => $truyenThong?->id,
                'start_offset'  => '+30 days 08:00',
                'end_offset'    => '+30 days 17:00',
                'location'      => 'Phòng Lab Đa phương tiện',
                'max_attendees' => 60,
                'is_members_only' => false,
                'status'        => 'draft',
                'registrations' => 0,
            ],
            [
                'title'         => 'Seminar: Blockchain và ứng dụng thực tế',
                'description'   => 'Buổi seminar về công nghệ Blockchain đã bị hủy do diễn giả có việc đột xuất.',
                'content'       => <<<'MD'
                ## Nội dung dự kiến

                - Tổng quan công nghệ **Blockchain** và cơ chế đồng thuận
                - Smart contract và ứng dụng thực tế ngoài tiền mã hóa
                - Demo viết smart contract đơn giản với *Solidity*

                > **Thông báo:** Sự kiện đã bị hủy do diễn giả có việc đột xuất. CLB sẽ tổ chức lại trong thời gian sớm nhất.
                MD,
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+7 days 09:00',
                'end_offset'    => '+7 days 11:00',
                'location'      => 'Phòng A305',
                'max_attendees' => 50,
                'is_members_only' => false,
                'status'        => 'cancelled',
                'registrations' => 0,
            ],
        ];

        foreach ($events as $data) {
            if (Event::withTrashed()->where('title', $data['title'])->exists()) {
                continue;
            }

            $event = Event::create([
                'created_by'   => $admin->id,
                'department_id' => $data['department_id'],
                'title'        => $data['title'],
                'slug'         => Event::generateUniqueSlug($data['title']),
                'description'  => $data['description'],
                'content'      => $data['content'],
                'thumbnail'    => null,
                'start_at'     => now()->modify($data['start_offset']),
                'end_at'       => now()->modify($data['end_offset']),
                'location'     => $data['location'],
                'max_attendees' => $data['max_attendees'],
                'is_members_only' => $data['is_members_only'],
                'status'       => $data['status'],
            ]);

            $registrationCount = min($data['registrations'], count($students));
            $registeredStudents = array_slice($students, 0, $registrationCount);
            $registrations = [];

            foreach ($registeredStudents as $studentId) {
                $registrations[] = EventRegistration::create([
                    'event_id'      => $event->id,
                    'user_id'       => $studentId,
                    'qr_token'      => EventRegistration::generateQrToken($event->id, $studentId),
                    'status'        => 'registered',
                    'registered_at' => $event->created_at,
                ]);
            }

            $checkInCount = min($data['check_ins'] ?? 0, count($registrations));
            $checkedInRegistrations = array_slice($registrations, 0, $checkInCount);

            foreach ($checkedInRegistrations as $registration) {
                EventCheckIn::create([
                    'event_id'        => $event->id,
                    'registration_id' => $registration->id,
                    'user_id'         => $registration->user_id,
                    'checked_in_by'   => $admin->id,
                    'checked_in_at'   => $event->start_at,
                    'method'          => 'qr',
                ]);
            }

            $feedbackCount = min($data['feedbacks'] ?? 0, count($registrations));
            $feedbackStudents = array_slice($registrations, 0, $feedbackCount);
            $sampleComments = [
                'Sự kiện rất bổ ích, mong CLB tổ chức thêm nhiều hoạt động như thế này!',
                'Nội dung hay nhưng thời lượng hơi ngắn, mong được mở rộng thêm.',
                'Diễn giả nhiệt tình, giải đáp thắc mắc rất chi tiết.',
                'Địa điểm tổ chức hơi xa nhưng nội dung xứng đáng.',
                null,
            ];

            foreach ($feedbackStudents as $i => $registration) {
                EventFeedback::create([
                    'event_id' => $event->id,
                    'user_id'  => $registration->user_id,
                    'rating'   => [4, 5, 5, 4, 3][$i % 5],
                    'comment'  => $sampleComments[$i % count($sampleComments)],
                ]);
            }

            $galleryCount = $data['gallery'] ?? 0;
            $galleryCaptions = [
                'Khoảnh khắc khai mạc sự kiện',
                'Các bạn sinh viên hăng say tham gia',
                'Phần trình bày của diễn giả',
                'Hoạt động nhóm sôi nổi',
                'Giao lưu, hỏi đáp cuối chương trình',
                'Chụp ảnh lưu niệm toàn thể',
                null,
                null,
            ];

            for ($i = 0; $i < $galleryCount; $i++) {
                EventGalleryItem::create([
                    'event_id'      => $event->id,
                    'uploaded_by'   => $admin->id,
                    'image_url'     => "https://picsum.photos/seed/event-{$event->id}-{$i}/800/600",
                    'caption'       => $galleryCaptions[$i % count($galleryCaptions)],
                    'display_order' => $i,
                ]);
            }
        }
    }
}
