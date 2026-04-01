<?php

namespace Database\Seeders;

use App\Models\ClubApplication;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClubApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'Quản trị viên',
                'is_active' => true,
            ]
        );

        $studentIds = User::where('email', 'like', 'student%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        if (count($studentIds) < 10) {
            return;
        }

        $applications = [
            ['status' => 'pending', 'note' => 'Ứng tuyển vào Ban Truyền thông đợt tháng 3.'],
            ['status' => 'processing', 'note' => 'Hồ sơ đang được ban chuyên môn xem xét.'],
            ['status' => 'interview', 'note' => 'Hẹn phỏng vấn trực tiếp vào chiều thứ Hai.'],
            ['status' => 'passed', 'note' => 'Đã vượt qua vòng phỏng vấn và chờ nhận nhiệm vụ.'],
            ['status' => 'failed', 'note' => 'Chưa phù hợp với tiêu chí tuyển chọn của đợt này.'],
            ['status' => 'pending', 'note' => 'Ứng tuyển vào Ban Kỹ thuật với mong muốn học thực chiến.'],
            ['status' => 'processing', 'note' => 'Đang chờ xác minh thông tin cá nhân và lịch học.'],
            ['status' => 'interview', 'note' => 'Phỏng vấn online lúc 19h00 qua Google Meet.'],
            ['status' => 'passed', 'note' => 'Đủ điều kiện tham gia và được đề xuất vào nhóm dự án.'],
            ['status' => 'failed', 'note' => 'Cần bổ sung thêm kỹ năng giao tiếp và làm việc nhóm.'],
        ];

        foreach ($applications as $index => $application) {
            $createdBy = $studentIds[$index];
            $createdAt = now()->subDays(10 - $index);

            ClubApplication::updateOrCreate(
                ['created_by' => $createdBy],
                [
                    'status' => $application['status'],
                    'note' => $application['note'],
                    'created_by' => $createdBy,
                    'updated_by' => $admin->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->copy()->addHours(4),
                ]
            );
        }
    }
}
