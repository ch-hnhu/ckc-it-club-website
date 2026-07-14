<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed phần "Giải thưởng & Thành tích" (section about-awards của trang About)
 * với dữ liệu thật, dùng 3 ảnh có sẵn trong storage/app/public/rewards.
 *
 * Khác với AboutPageSeeder (chỉ seed khi chưa có dữ liệu), seeder này ghi đè
 * value active của about-awards để cập nhật danh sách giải thưởng kèm ảnh.
 * Yêu cầu đã chạy `php artisan storage:link` để ảnh truy cập được qua /storage.
 */
class AboutAwardsSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        // Đảm bảo bản ghi club_informations của section tồn tại.
        DB::table('club_informations')->updateOrInsert(
            ['slug' => 'about-awards'],
            [
                'value' => 'about-awards',
                'label' => 'About — Giải thưởng & Thành tích',
                'description' => 'Danh sách giải thưởng, thành tích nổi bật (icon, tên giải, cuộc thi/đơn vị, năm, mô tả, ảnh, màu nền).',
                'created_at' => now(),
                'created_by' => $adminId,
                'updated_at' => now(),
                'updated_by' => $adminId,
                'deleted_at' => null,
                'deleted_by' => null,
            ]
        );

        $infoId = DB::table('club_informations')->where('slug', 'about-awards')->value('id');

        $json = json_encode($this->awards(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $value = DB::table('club_information_values')
            ->where('club_information_id', $infoId)
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('id')
            ->first();

        if ($value) {
            DB::table('club_information_values')->where('id', $value->id)->update([
                'value' => $json,
                'updated_at' => now(),
                'updated_by' => $adminId,
            ]);
        } else {
            DB::table('club_information_values')->insert([
                'club_information_id' => $infoId,
                'value' => $json,
                'link' => null,
                'alt' => null,
                'position' => 0,
                'is_active' => true,
                'created_at' => now(),
                'created_by' => $adminId,
                'updated_at' => now(),
                'updated_by' => $adminId,
            ]);
        }
    }

    /**
     * Danh sách giải thưởng, mỗi giải gắn một ảnh trong storage/app/public/rewards.
     *
     * @return array<int, array<string, string>>
     */
    private function awards(): array
    {
        return [
            [
                'icon' => 'Award',
                'title' => 'Thành tích xuất sắc phong trào Hội nhiệm kỳ 2020 – 2023',
                'event' => 'Hội Sinh viên Việt Nam TP. Hồ Chí Minh',
                'year' => '2020 – 2023',
                'desc' => 'Câu lạc bộ được Hội Sinh viên Việt Nam TP.HCM tặng bằng khen vì có thành tích xuất sắc trong công tác Hội và phong trào sinh viên năm học 2020 – 2023.',
                'bg' => 'var(--color-pastel-yellow)',
                'image' => $this->imageUrl('bang-khen-hoi-2025.jpg'),
            ],
            [
                'icon' => 'Award',
                'title' => 'Đơn vị xuất sắc Chiến dịch Mùa hè xanh',
                'event' => 'Chiến dịch tình nguyện Mùa hè xanh',
                'year' => '2024',
                'desc' => 'Tập thể câu lạc bộ được ghi nhận là đơn vị hoàn thành xuất sắc nhiệm vụ trong chiến dịch tình nguyện Mùa hè xanh, lan tỏa tinh thần sinh viên tình nguyện.',
                'bg' => 'var(--color-pastel-green)',
                'image' => $this->imageUrl('mua-he-xanh.jpg'),
            ],
            [
                'icon' => 'Award',
                'title' => 'Thành tích xuất sắc phong trào Hội nhiệm kỳ 2020 – 2023',
                'event' => 'Hội Sinh viên Việt Nam TP. Hồ Chí Minh',
                'year' => '2020 – 2023',
                'desc' => 'Được tuyên dương vì đóng góp tích cực cho công tác Hội và phong trào sinh viên trong suốt giai đoạn 2020 – 2023.',
                'bg' => 'var(--color-pastel-blue)',
                'image' => $this->imageUrl('phong-trao-hoi-2020-2023.jpg'),
            ],
        ];
    }

    /**
     * Trả URL tuyệt đối của ảnh trong disk public (cùng định dạng với
     * AboutPageController::uploadImage) để frontend hiển thị trực tiếp.
     */
    private function imageUrl(string $filename): string
    {
        $url = '/storage/rewards/'.$filename;
        if ($appUrl = config('app.url')) {
            $url = rtrim((string) $appUrl, '/').$url;
        }

        return $url;
    }
}
