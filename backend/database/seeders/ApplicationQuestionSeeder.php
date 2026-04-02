<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ApplicationQuestionSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id');

        $questions = [
            ['label' => 'Bạn muốn ứng tuyển vào ban nào?', 'type' => 'select', 'is_required' => true, 'order_index' => 1],
            ['label' => 'Hãy giới thiệu ngắn gọn về bản thân.', 'type' => 'textarea', 'is_required' => true, 'order_index' => 2],
            ['label' => 'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?', 'type' => 'radio', 'is_required' => true, 'order_index' => 3],
            ['label' => 'Kỹ năng nổi bật nhất của bạn là gì?', 'type' => 'text', 'is_required' => true, 'order_index' => 4],
            ['label' => 'Bạn có thể tham gia sinh hoạt vào khung giờ nào?', 'type' => 'select', 'is_required' => true, 'order_index' => 5],
            ['label' => 'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?', 'type' => 'textarea', 'is_required' => true, 'order_index' => 6],
            ['label' => 'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?', 'type' => 'radio', 'is_required' => true, 'order_index' => 7],
            ['label' => 'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?', 'type' => 'radio', 'is_required' => true, 'order_index' => 8],
            ['label' => 'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?', 'type' => 'textarea', 'is_required' => true, 'order_index' => 9],
            ['label' => 'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).', 'type' => 'text', 'is_required' => false, 'order_index' => 10],
        ];

        foreach ($questions as $question) {
            DB::table('application_questions')->updateOrInsert(
                ['label' => $question['label']],
                [
                    'type' => $question['type'],
                    'is_required' => $question['is_required'],
                    'order_index' => $question['order_index'],
                    'is_active' => true,
                    'created_at' => now(),
                    'created_by' => $adminId,
                    'updated_at' => now(),
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                    'deleted_by' => null,
                ]
            );
        }
    }
}
