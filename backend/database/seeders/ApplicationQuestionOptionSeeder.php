<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ApplicationQuestionOptionSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id');

        $questionIds = DB::table('application_questions')->pluck('id', 'label');

        $options = [
            'Bạn muốn ứng tuyển vào ban nào?' => [
                ['value' => 'ban-ky-thuat', 'label' => 'Ban Kỹ thuật'],
                ['value' => 'ban-truyen-thong', 'label' => 'Ban Truyền thông'],
                ['value' => 'ban-su-kien', 'label' => 'Ban Sự kiện'],
                ['value' => 'ban-noi-dung', 'label' => 'Ban Nội dung'],
                ['value' => 'ban-doi-ngoai', 'label' => 'Ban Đối ngoại'],
            ],
            'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => [
                ['value' => 'chua', 'label' => 'Chưa từng tham gia'],
                ['value' => 'co-mot-lan', 'label' => 'Có, từng tham gia một lần'],
                ['value' => 'co-thuong-xuyen', 'label' => 'Có, tham gia thường xuyên'],
            ],
            'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => [
                ['value' => 'toi-thu-2-4-6', 'label' => 'Buổi tối thứ 2, 4, 6'],
                ['value' => 'toi-thu-3-5-7', 'label' => 'Buổi tối thứ 3, 5, 7'],
                ['value' => 'cuoi-tuan', 'label' => 'Cuối tuần'],
                ['value' => 'linh-hoat', 'label' => 'Linh hoạt theo lịch câu lạc bộ'],
            ],
            'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => [
                ['value' => 'khong', 'label' => 'Chưa có kinh nghiệm'],
                ['value' => 'co-co-ban', 'label' => 'Có kinh nghiệm cơ bản'],
                ['value' => 'co-tot', 'label' => 'Có kinh nghiệm tốt'],
            ],
            'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => [
                ['value' => 'co', 'label' => 'Có'],
                ['value' => 'khong', 'label' => 'Không'],
            ],
        ];

        foreach ($options as $questionLabel => $questionOptions) {
            $questionId = $questionIds[$questionLabel] ?? null;

            if (!$questionId) {
                continue;
            }

            foreach ($questionOptions as $option) {
                DB::table('application_question_options')->updateOrInsert(
                    [
                        'question_id' => $questionId,
                        'value' => $option['value'],
                    ],
                    [
                        'label' => $option['label'],
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
}
