<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ApplicationAnswerSeeder extends Seeder
{
    public function run(): void
    {
        $applications = DB::table('club_applications')
            ->orderBy('id')
            ->get(['id']);

        $questions = DB::table('application_questions')
            ->orderBy('order_index')
            ->pluck('id', 'label');

        $answerTemplates = [
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-truyen-thong',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em là sinh viên năng động, thích làm việc nhóm và luôn chủ động học hỏi kiến thức mới.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-thuong-xuyen',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Thiết kế nội dung truyền thông trên Canva và CapCut.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-2-4-6',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn rèn kỹ năng tổ chức công việc và đóng góp vào các hoạt động truyền thông của câu lạc bộ.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-co-ban',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể hỗ trợ viết bài, chụp ảnh và thiết kế poster cho các sự kiện.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://portfolio.example.com/minhanh',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-ky-thuat',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em yêu thích lập trình web, có tinh thần trách nhiệm và thích tham gia hoạt động cộng đồng.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-mot-lan',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Xây dựng giao diện React và tối ưu trải nghiệm người dùng.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'linh-hoat',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn tham gia dự án thực tế, học quy trình làm việc nhóm và nâng cao kỹ năng kỹ thuật.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'khong',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em muốn hỗ trợ phát triển website, landing page và công cụ quản lý nội bộ.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://github.com/example/haidang',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-noi-dung',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em thích viết lách, có khả năng tổng hợp thông tin và luôn chú ý đến chất lượng nội dung.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-thuong-xuyen',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Viết bài truyền thông và biên tập nội dung ngắn gọn, rõ ràng.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-3-5-7',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn trau dồi kỹ năng sáng tạo nội dung và làm việc trong môi trường nhiều dự án.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-co-ban',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể phụ trách viết recap sự kiện, bài đăng fanpage và nội dung email.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://drive.google.com/example-thuha',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-su-kien',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em là người cẩn thận, giao tiếp tốt và thích tham gia khâu tổ chức cho các hoạt động đông người.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-mot-lan',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Lập kế hoạch, điều phối và xử lý tình huống tại sự kiện.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'cuoi-tuan',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn tích lũy kinh nghiệm tổ chức sự kiện sinh viên chuyên nghiệp hơn.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-tot',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể hỗ trợ lên timeline, checklist hậu cần và phối hợp nhân sự ngày diễn ra chương trình.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://portfolio.example.com/quochuy',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-doi-ngoai',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em tự tin trong giao tiếp, có tinh thần cầu tiến và muốn kết nối thêm nhiều đối tác sinh viên.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'chua',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Giao tiếp, thuyết trình và duy trì quan hệ với đối tác.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-2-4-6',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn cải thiện kỹ năng đối ngoại và đại diện câu lạc bộ trong các chương trình liên kết.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-co-ban',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'khong',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể hỗ trợ kết nối diễn giả, nhà tài trợ và các đơn vị đồng hành.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => '',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-ky-thuat',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em thích tìm hiểu công nghệ mới, có tư duy logic và sẵn sàng hỗ trợ các dự án nội bộ.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-mot-lan',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Lập trình backend với PHP và thiết kế cơ sở dữ liệu.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-3-5-7',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn cải thiện kỹ năng xây dựng API và làm việc theo quy trình nhóm.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'khong',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể tham gia bảo trì hệ thống, sửa lỗi và hỗ trợ triển khai chức năng mới.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://github.com/example/giabao',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-truyen-thong',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em có khả năng chụp ảnh, dựng video ngắn và luôn bám sát deadline.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-thuong-xuyen',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Dựng video recap và thiết kế bài đăng mạng xã hội.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'cuoi-tuan',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn xây dựng portfolio truyền thông và đồng hành lâu dài với các hoạt động của câu lạc bộ.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-tot',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể phụ trách hậu kỳ hình ảnh, video và hỗ trợ livestream khi cần.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://behance.net/example/ngocmai',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-noi-dung',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em thích nghiên cứu xu hướng, biết cách kể chuyện và có khả năng làm việc độc lập tốt.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'chua',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Lên ý tưởng nội dung và viết kịch bản ngắn cho video truyền thông.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'linh-hoat',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn nâng cao tư duy nội dung số và học cách phối hợp cùng đội thiết kế, quay dựng.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-co-ban',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em muốn hỗ trợ brainstorming chiến dịch và xây dựng bộ nội dung theo từng sự kiện.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => '',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-truyen-thong',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em có nền tảng thiết kế cơ bản, yêu thích sáng tạo hình ảnh và thường xuyên cập nhật xu hướng mới.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-mot-lan',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Thiết kế poster, banner và chỉnh sửa ảnh sự kiện.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-2-4-6',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn phát triển kỹ năng thiết kế trong môi trường thực tế và đóng góp sản phẩm chất lượng cho câu lạc bộ.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-co-ban',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể hỗ trợ thiết kế bộ nhận diện cho workshop, cuộc thi và các chiến dịch nội bộ.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://behance.net/example/baotram',
            ],
            [
                'Bạn muốn ứng tuyển vào ban nào?' => 'ban-doi-ngoai',
                'Hãy giới thiệu ngắn gọn về bản thân.' => 'Em chủ động, đúng giờ và có khả năng giao tiếp tiếng Anh khá tốt.',
                'Bạn đã từng tham gia câu lạc bộ hoặc đội nhóm nào chưa?' => 'co-thuong-xuyen',
                'Kỹ năng nổi bật nhất của bạn là gì?' => 'Giao tiếp song ngữ và chuẩn bị tài liệu làm việc với đối tác.',
                'Bạn có thể tham gia sinh hoạt vào khung giờ nào?' => 'toi-thu-3-5-7',
                'Mục tiêu của bạn khi tham gia câu lạc bộ là gì?' => 'Em muốn mở rộng mạng lưới kết nối và đóng góp vào các hoạt động hợp tác của câu lạc bộ.',
                'Bạn có kinh nghiệm về truyền thông hoặc sự kiện không?' => 'co-tot',
                'Bạn có thể mang laptop cá nhân khi tham gia hoạt động không?' => 'co',
                'Bạn mong muốn đóng góp điều gì cho câu lạc bộ?' => 'Em có thể hỗ trợ viết email đối tác, biên dịch tài liệu và điều phối các buổi làm việc chung.',
                'Đính kèm link portfolio hoặc sản phẩm cá nhân (nếu có).' => 'https://linkedin.com/in/example-ducthanh',
            ],
        ];

        foreach ($applications as $index => $application) {
            $answers = $answerTemplates[$index] ?? null;

            if (!$answers) {
                continue;
            }

            foreach ($answers as $questionLabel => $answerValue) {
                $questionId = $questions[$questionLabel] ?? null;

                if (!$questionId) {
                    continue;
                }

                DB::table('application_answers')->updateOrInsert(
                    [
                        'application_id' => $application->id,
                        'question_id' => $questionId,
                    ],
                    [
                        'answer_value' => $answerValue,
                    ]
                );
            }
        }
    }
}
