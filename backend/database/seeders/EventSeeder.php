<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventFeedback;
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
                'content'       => "## Nội dung\n\n- Tổng quan kiến trúc RESTful API\n- Thiết kế database & migration\n- Xác thực với Laravel Sanctum\n- Thực hành xây dựng CRUD API\n- Q&A cùng diễn giả\n\n## Đối tượng\n\nSinh viên đã có kiến thức cơ bản về PHP/Laravel.",
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+5 days 09:00',
                'end_offset'    => '+5 days 11:30',
                'location'      => 'Phòng A305, Trường Cao đẳng Kỹ thuật Cao Thắng',
                'max_attendees' => 50,
                'is_registration_required' => true,
                'status'        => 'published',
                'registrations' => 8,
            ],
            [
                'title'         => 'Cuộc thi Hackathon CKC 2026',
                'description'   => 'Sân chơi lập trình lớn nhất năm dành cho sinh viên đam mê công nghệ với chủ đề "Công nghệ vì cộng đồng".',
                'content'       => "## Thể lệ\n\n- Mỗi đội từ 3-5 thành viên\n- Thời gian thi: 24 giờ liên tục\n- Chủ đề: Công nghệ vì cộng đồng\n\n## Giải thưởng\n\n- Giải Nhất: 5.000.000đ\n- Giải Nhì: 3.000.000đ\n- Giải Ba: 2.000.000đ",
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+12 days 08:00',
                'end_offset'    => '+13 days 17:00',
                'location'      => 'Hội trường lớn',
                'max_attendees' => 100,
                'is_registration_required' => true,
                'status'        => 'published',
                'registrations' => 15,
            ],
            [
                'title'         => 'Talkshow: Định hướng nghề nghiệp ngành IT',
                'description'   => 'Trò chuyện cùng các anh chị cựu sinh viên đang làm việc tại các công ty công nghệ về kinh nghiệm xin việc và phát triển sự nghiệp.',
                'content'       => "## Diễn giả\n\nCác cựu sinh viên CLB IT CKC hiện đang công tác tại FPT Software, VNG, Tiki.\n\n## Chủ đề thảo luận\n\n- Chuẩn bị hồ sơ xin việc\n- Kinh nghiệm phỏng vấn thực tập\n- Lộ trình phát triển Junior → Senior",
                'department_id' => $truyenThong?->id,
                'start_offset'  => '+20 days 14:00',
                'end_offset'    => '+20 days 16:30',
                'location'      => 'Hội trường B, Cơ sở 2',
                'max_attendees' => null,
                'is_registration_required' => true,
                'status'        => 'published',
                'registrations' => 5,
            ],

            // ── Đang diễn ra ──────────────────────────────────────────────
            [
                'title'         => 'Buổi sinh hoạt CLB tháng 6',
                'description'   => 'Tổng kết hoạt động tháng và giao lưu giữa các thành viên CLB IT CKC.',
                'content'       => "## Nội dung\n\n- Tổng kết hoạt động tháng 6\n- Giới thiệu thành viên mới\n- Mini game & giao lưu",
                'department_id' => null,
                'start_offset'  => '-1 hours',
                'end_offset'    => '+2 hours',
                'location'      => 'Phòng sinh hoạt CLB',
                'max_attendees' => null,
                'is_registration_required' => false,
                'status'        => 'ongoing',
                'registrations' => 0,
            ],

            // ── Đã kết thúc (có điểm danh + đánh giá) ───────────────────────
            [
                'title'         => 'Workshop: Giới thiệu Git & GitHub cho người mới',
                'description'   => 'Buổi workshop nhập môn Git và GitHub dành cho tân sinh viên, hướng dẫn quy trình làm việc nhóm cơ bản.',
                'content'       => "## Nội dung\n\n- Cài đặt Git\n- Các lệnh Git cơ bản\n- Làm việc với GitHub\n- Thực hành tạo Pull Request",
                'department_id' => $hocThuat?->id,
                'start_offset'  => '-10 days 09:00',
                'end_offset'    => '-10 days 11:00',
                'location'      => 'Phòng A305',
                'max_attendees' => 40,
                'is_registration_required' => true,
                'status'        => 'ended',
                'registrations' => 12,
                'check_ins'     => 9,
                'feedbacks'     => 7,
            ],
            [
                'title'         => 'Chiến dịch Tình nguyện mùa hè xanh 2026',
                'description'   => 'Hoạt động tình nguyện hỗ trợ cộng đồng, dạy tin học miễn phí cho trẻ em tại trung tâm bảo trợ xã hội.',
                'content'       => "## Hoạt động\n\n- Dạy tin học cơ bản cho trẻ em\n- Sửa chữa thiết bị máy tính cũ\n- Trao quà cho trung tâm",
                'department_id' => $tinhNguyen?->id,
                'start_offset'  => '-3 days 07:00',
                'end_offset'    => '-3 days 17:00',
                'location'      => 'Trung tâm Bảo trợ xã hội Quận 8',
                'max_attendees' => 30,
                'is_registration_required' => true,
                'status'        => 'ended',
                'registrations' => 18,
                'check_ins'     => 16,
                'feedbacks'     => 11,
            ],

            // ── Bản nháp & đã hủy ────────────────────────────────────────────
            [
                'title'         => 'Cuộc thi thiết kế UI/UX CKC Design Challenge',
                'description'   => 'Cuộc thi thiết kế giao diện ứng dụng dành cho sinh viên yêu thích UI/UX. Đang trong giai đoạn lên kế hoạch.',
                'content'       => null,
                'department_id' => $truyenThong?->id,
                'start_offset'  => '+30 days 08:00',
                'end_offset'    => '+30 days 17:00',
                'location'      => 'Phòng Lab Đa phương tiện',
                'max_attendees' => 60,
                'is_registration_required' => true,
                'status'        => 'draft',
                'registrations' => 0,
            ],
            [
                'title'         => 'Seminar: Blockchain và ứng dụng thực tế',
                'description'   => 'Buổi seminar về công nghệ Blockchain đã bị hủy do diễn giả có việc đột xuất.',
                'content'       => null,
                'department_id' => $hocThuat?->id,
                'start_offset'  => '+7 days 09:00',
                'end_offset'    => '+7 days 11:00',
                'location'      => 'Phòng A305',
                'max_attendees' => 50,
                'is_registration_required' => true,
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
                'is_registration_required' => $data['is_registration_required'],
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
        }
    }
}
