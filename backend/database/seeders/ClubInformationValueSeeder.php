<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClubInformationValueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        $clubInformationIds = DB::table('club_informations')
            ->whereIn('slug', [
                'club-name',
                'club-slogan',
                'club-email',
                'about-club',
                'club-logo',
                'home-banners',
                'facebook-page',
                'recruitment-enabled',
                'auto-send-mail-recruitment',
                'ai-chatbot-system-prompt',
            ])
            ->pluck('id', 'slug');

        $aiChatbotSystemPrompt = <<<'PROMPT'
Bạn là trợ lý ảo của Câu lạc bộ IT (CKC IT Club) — một câu lạc bộ học thuật về Công nghệ thông tin.
Nhiệm vụ: trả lời ngắn gọn, thân thiện, chính xác các câu hỏi của thành viên và khách về câu lạc bộ.

THÔNG TIN VỀ CÂU LẠC BỘ:
- Tên: CKC IT Club — Câu lạc bộ Công nghệ thông tin.
- Lĩnh vực hoạt động: lập trình, phát triển web/app, thi đấu học thuật, workshop kỹ năng, dự án nhóm.
- Đối tượng tham gia: sinh viên yêu thích CNTT, không yêu cầu kinh nghiệm trước.
- Cách tham gia: đăng ký qua trang "Đăng ký thành viên" trên website, hoặc liên hệ ban chủ nhiệm.
- Hoạt động thường kỳ: sinh hoạt định kỳ, các buổi workshop, cuộc thi lập trình, chia sẻ kiến thức.
- Website có các mục: Sự kiện, Khoá học, Cộng đồng, Blog, Tài nguyên học tập.

QUY TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, giọng điệu thân thiện, xưng "mình" và gọi người dùng là "bạn".
- Trả lời ngắn gọn, đi thẳng vào trọng tâm; dùng markdown (danh sách, in đậm) khi phù hợp.
- Nếu câu hỏi nằm ngoài phạm vi thông tin CLB hoặc bạn không chắc, hãy nói thật là mình chưa có thông tin
  và gợi ý người dùng liên hệ ban chủ nhiệm hoặc dùng mục Liên hệ trên website. Tuyệt đối không bịa đặt.
- Không trả lời các nội dung không liên quan đến câu lạc bộ, học tập hay CNTT.
PROMPT;

        $values = [
            [
                'slug' => 'club-name',
                'value' => 'CKC IT Club',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-slogan',
                'value' => 'Kết nối đam mê, kiến tạo công nghệ',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-email',
                'value' => 'itclub@caothang.edu.vn',
                'link' => 'mailto:itclub@caothang.edu.vn',
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'about-club',
                'value' => 'CKC IT Club là môi trường học tập, chia sẻ và thực hành công nghệ.',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-logo',
                'value' => '/images/club/logo-ckc-it-club.png',
                'link' => '/',
                'alt' => 'Logo CKC IT Club',
                'position' => null,
            ],
            [
                'slug' => 'home-banners',
                'value' => '/images/club/banner-workshop.png',
                'link' => '/events',
                'alt' => 'Workshop công nghệ CKC IT Club',
                'position' => 1,
            ],
            [
                'slug' => 'home-banners',
                'value' => '/images/club/banner-recruitment.png',
                'link' => '/recruitment',
                'alt' => 'Tuyển thành viên CKC IT Club',
                'position' => 2,
            ],
            [
                'slug' => 'facebook-page',
                'value' => 'https://www.facebook.com/itclub.caothang',
                'link' => 'https://www.facebook.com/itclub.caothang',
                'alt' => 'Facebook CKC IT Club',
                'position' => null,
            ],
            [
                'slug' => 'recruitment-enabled',
                'value' => 'true',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'auto-send-mail-recruitment',
                'value' => 'false',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'ai-chatbot-system-prompt',
                'value' => $aiChatbotSystemPrompt,
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
        ];

        foreach ($values as $item) {
            $clubInformationId = $clubInformationIds[$item['slug']] ?? null;

            if (! $clubInformationId) {
                continue;
            }

            DB::table('club_information_values')->updateOrInsert(
                [
                    'club_information_id' => $clubInformationId,
                    'value' => $item['value'],
                ],
                [
                    'link' => $item['link'],
                    'alt' => $item['alt'],
                    'position' => $item['position'],
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
