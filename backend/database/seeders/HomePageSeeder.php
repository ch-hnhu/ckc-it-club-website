<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed nội dung tĩnh của trang chủ (Landing) vào hệ thống club_informations.
 *
 * Mỗi section tĩnh của trang chủ là một bản ghi club_informations với slug dạng
 * `home-<section>` và type `json`. Giá trị thực (JSON) nằm ở bản ghi
 * club_information_values đang active. Trang admin "Quản lý trang chủ" chỉnh sửa
 * các JSON này qua form từng trường; frontend user đọc lại qua GET /api/v1/home-page.
 *
 * Dữ liệu mặc định trích nguyên văn từ giao diện hardcode cũ để không đổi hiển thị.
 */
class HomePageSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        foreach ($this->sections() as $section) {
            DB::table('club_informations')->updateOrInsert(
                ['slug' => $section['slug']],
                [
                    'value' => $section['slug'],
                    'label' => $section['label'],
                    'type' => 'json',
                    'description' => $section['description'],
                    'created_at' => now(),
                    'created_by' => $adminId,
                    'updated_at' => now(),
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                    'deleted_by' => null,
                ]
            );

            $id = DB::table('club_informations')->where('slug', $section['slug'])->value('id');

            $json = json_encode($section['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            // Chỉ seed value nếu section chưa có value nào (tránh ghi đè nội dung admin đã sửa).
            $hasValue = DB::table('club_information_values')
                ->where('club_information_id', $id)
                ->exists();

            if (! $hasValue) {
                DB::table('club_information_values')->insert([
                    'club_information_id' => $id,
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
    }

    /**
     * @return array<int, array{slug:string,label:string,description:string,data:mixed}>
     */
    private function sections(): array
    {
        return [
            [
                'slug' => 'home-hero',
                'label' => 'Trang chủ — Hero',
                'description' => 'Phần đầu trang chủ (badge, tiêu đề, mô tả, con số, nút).',
                'data' => [
                    'badge' => 'Trường Cao đẳng Kỹ thuật Cao Thắng',
                    'title_line1' => 'CKC IT CLUB',
                    'title_line2' => 'Kết nối công nghệ, kiến tạo',
                    'highlight' => 'tương lai',
                    'lead_html' => 'Khám phá tài nguyên, tham gia sự kiện và phát triển kỹ năng cùng hơn <strong>1000+ sinh viên IT</strong> tại Cao Thắng.',
                    'stats' => [
                        ['value' => '1000+', 'label' => 'Thành viên'],
                        ['value' => '50+', 'label' => 'Tài nguyên'],
                        ['value' => '20+', 'label' => 'Sự kiện/năm'],
                    ],
                    'primary_label' => 'Khám phá ngay',
                    'primary_link' => '#resources',
                    'secondary_label' => 'Tham gia CLB',
                    'secondary_link' => '/ung-tuyen',
                ],
            ],
            [
                'slug' => 'home-quick-actions',
                'label' => 'Trang chủ — Khám phá (Quick Actions)',
                'description' => 'Lưới thẻ điều hướng nhanh (tài nguyên, bài viết, sự kiện...).',
                'data' => [
                    'heading' => 'Khám phá CKC IT CLUB',
                    'subheading' => 'Tất cả những gì bạn cần để học, chia sẻ và phát triển trong cộng đồng IT',
                    'items' => [
                        ['emoji' => '📚', 'title' => 'Tài nguyên', 'desc' => 'Kho tài liệu phong phú: slide, code, video từ cộng đồng & mentor', 'link' => '/tai-nguyen', 'bg' => 'var(--color-pastel-green)', 'requireAuth' => false],
                        ['emoji' => '✍️', 'title' => 'Bài viết', 'desc' => 'Bài viết kỹ thuật, kinh nghiệm học tập và chia sẻ từ các thành viên', 'link' => '/blog', 'bg' => 'var(--color-pastel-blue)', 'requireAuth' => false],
                        ['emoji' => '🏆', 'title' => 'Bảng xếp hạng', 'desc' => 'Xem bảng xếp hạng, tích lũy điểm XP qua các hoạt động của CLB', 'link' => '/cong-dong/bang-xep-hang', 'bg' => 'var(--color-pastel-yellow)', 'requireAuth' => false],
                        ['emoji' => '🎉', 'title' => 'Sự kiện', 'desc' => 'Sự kiện workshop, hackathon, seminar hấp dẫn sắp diễn ra', 'link' => '/su-kien', 'bg' => 'var(--color-pastel-pink)', 'requireAuth' => false],
                        ['emoji' => '🎓', 'title' => 'Khóa học', 'desc' => 'Các khóa học chất lượng về Web, AI, Mobile, DevOps và hơn thế nữa', 'link' => '/khoa-hoc', 'bg' => 'var(--color-pastel-purple)', 'requireAuth' => false],
                        ['emoji' => '💡', 'title' => 'Đóng góp', 'desc' => 'Chia sẻ tài nguyên, viết blog, hoặc tổ chức workshop với cộng đồng', 'link' => '/tai-nguyen/gui', 'bg' => 'var(--color-pastel-orange)', 'requireAuth' => true],
                    ],
                ],
            ],
            [
                'slug' => 'home-about',
                'label' => 'Trang chủ — Về CLB',
                'description' => 'Khối giới thiệu ngắn + cột mốc + thẻ giá trị cốt lõi.',
                'data' => [
                    'heading' => 'Về CKC IT CLUB',
                    'paragraphs_html' => [
                        'CKC IT CLUB là cộng đồng sinh viên IT năng động tại <strong>Trường Cao đẳng Kỹ thuật Cao Thắng</strong>. Chúng tôi học, chia sẻ và cùng nhau phát triển — tin rằng mọi sinh viên đều có tiềm năng to lớn khi được hỗ trợ đúng cách.',
                        'Từ năm 2011, chúng tôi đã kết nối hàng nghìn sinh viên với tài nguyên, mentor và cơ hội việc làm thực tế. Đây không chỉ là câu lạc bộ — đây là <mark>ngôi nhà thứ hai</mark> của bạn trong hành trình IT.',
                    ],
                    'milestones' => [
                        ['value' => '2011', 'label' => 'Năm thành lập'],
                        ['value' => '50+', 'label' => 'Workshops'],
                        ['value' => '95%', 'label' => 'Có việc sau học'],
                    ],
                    'button_label' => 'Xem thêm về chúng tôi',
                    'button_link' => '#events',
                    'values' => [
                        ['emoji' => '📚', 'title' => 'Học hỏi', 'subtitle' => 'Học không ngừng', 'desc' => 'Tiếp cận tài nguyên, khóa học và kiến thức từ mentor chuyên nghiệp.', 'bg' => 'var(--color-pastel-green)'],
                        ['emoji' => '🤝', 'title' => 'Chia sẻ', 'subtitle' => 'Chia sẻ cùng nhau', 'desc' => 'Văn hóa open-source: chia sẻ code, tài liệu, kinh nghiệm với cả cộng đồng.', 'bg' => 'var(--color-pastel-blue)'],
                        ['emoji' => '🏆', 'title' => 'Bứt phá', 'subtitle' => 'Cạnh tranh lành mạnh', 'desc' => 'Tham gia hackathon, leaderboard và thử thách bản thân qua các sự kiện.', 'bg' => 'var(--color-pastel-yellow)'],
                        ['emoji' => '🌱', 'title' => 'Trưởng thành', 'subtitle' => 'Phát triển bản thân', 'desc' => 'Xây dựng portfolio, kỹ năng mềm và mạng lưới chuyên nghiệp từ trường.', 'bg' => 'var(--color-pastel-purple)'],
                    ],
                ],
            ],
            [
                'slug' => 'home-headers',
                'label' => 'Trang chủ — Tiêu đề các khối',
                'description' => 'Tiêu đề & mô tả của các khối động (Người thành lập, Ban chủ nhiệm, Nội dung nổi bật, Bảng xếp hạng, Giải thưởng).',
                'data' => [
                    'mentor' => [
                        'title' => 'Người thành lập',
                        'subtitle' => 'Người đã đặt nền móng cho CLB IT CKC, đồng thời là cố vấn cho các thành viên trong CLB.',
                    ],
                    'board' => [
                        'title' => 'Ban Chủ Nhiệm',
                        'subtitle' => 'Những người dẫn dắt và xây dựng CKC IT CLUB',
                    ],
                    'featured' => [
                        'title' => 'Nội dung nổi bật',
                        'subtitle' => 'Bài viết, sự kiện và khóa học được cộng đồng yêu thích nhất',
                        'blog_title' => '✍️ Bài viết nổi bật',
                        'event_title' => '🎉 Sự kiện sắp diễn ra',
                        'course_title' => '🎓 Khóa học nổi bật',
                    ],
                    'leaderboard' => [
                        'title' => 'Bảng Xếp Hạng',
                        'cta_label' => 'Xem bảng đầy đủ',
                    ],
                    'awards' => [
                        'title' => 'Giải Thưởng & Thành Tích',
                        'subtitle' => 'Những dấu ấn tự hào trên hành trình phát triển của CKC IT CLUB',
                    ],
                ],
            ],
            [
                'slug' => 'home-contribution',
                'label' => 'Trang chủ — Kêu gọi đóng góp',
                'description' => 'Khối kêu gọi đóng góp tài nguyên.',
                'data' => [
                    'heading' => 'Góp phần xây dựng kho tài nguyên chung',
                    'body_html' => 'Chia sẻ tài liệu, code, slide hay bất kỳ thứ gì hữu ích với hơn <strong>1000+ sinh viên IT</strong> trong cộng đồng CKC IT CLUB.',
                    'button_label' => 'Đóng góp tài nguyên',
                ],
            ],
            [
                'slug' => 'home-cta',
                'label' => 'Trang chủ — CTA cuối trang',
                'description' => 'Khối kêu gọi tham gia ở cuối trang chủ.',
                'data' => [
                    'badge' => 'Miễn phí — Không cần kinh nghiệm',
                    'title_prefix' => 'Tham gia cộng đồng',
                    'highlight' => '1000+ sinh viên IT',
                    'title_suffix' => 'ngay hôm nay',
                    'subtext' => 'Chỉ cần đam mê. Mọi thứ khác — tài nguyên, mentor, cộng đồng — chúng tôi đã có sẵn cho bạn.',
                    'button_label' => 'Tham gia ngay miễn phí',
                    'button_link' => '/ung-tuyen',
                    'trust_text' => '✓ Không spam · ✓ Không mất tiền · ✓ Hủy bất cứ lúc nào',
                ],
            ],
        ];
    }
}
