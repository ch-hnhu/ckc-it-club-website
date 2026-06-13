<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MailTemplateSeeder extends Seeder
{
    private array $types = [
        [
            'slug' => 'processing',
            'label' => 'Thông báo đang xét duyệt',
            'description' => 'Gửi khi đơn ứng tuyển chuyển sang trạng thái đang xét duyệt.',
        ],
        [
            'slug' => 'interview',
            'label' => 'Thư mời phỏng vấn',
            'description' => 'Gửi khi ứng viên vượt qua vòng hồ sơ và được mời phỏng vấn.',
        ],
        [
            'slug' => 'passed',
            'label' => 'Thông báo trúng tuyển',
            'description' => 'Gửi khi ứng viên chính thức trở thành thành viên CLB.',
        ],
        [
            'slug' => 'failed',
            'label' => 'Thông báo không trúng tuyển',
            'description' => 'Gửi khi đơn ứng tuyển không đáp ứng yêu cầu.',
        ],
    ];

    private array $defaultTemplates = [
        'processing' => [
            'name' => 'Template mặc định',
            'subject' => '[CKC IT CLUB] Đơn ứng tuyển của bạn đang được xem xét',
            'body' => '<p>Xin chào <strong>{{applicant_name}}</strong>,</p>
<p>Cảm ơn bạn đã gửi đơn ứng tuyển tham gia <strong>{{club_name}}</strong>.</p>
<p>Chúng tôi đã nhận được đơn của bạn và đang trong quá trình xem xét. Ban Nhân sự sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
<p>Trân trọng,<br><strong>{{club_name}}</strong></p>',
        ],
        'interview' => [
            'name' => 'Template mặc định',
            'subject' => '[CKC IT CLUB] Bạn được mời tham gia buổi phỏng vấn',
            'body' => '<p>Xin chào <strong>{{applicant_name}}</strong>,</p>
<p>Chúc mừng! Đơn ứng tuyển của bạn đã vượt qua vòng xét hồ sơ của <strong>{{club_name}}</strong>.</p>
<p>Ban Nhân sự sẽ liên hệ với bạn qua email hoặc điện thoại để sắp xếp lịch phỏng vấn. Vui lòng chú ý kiểm tra email và điện thoại trong thời gian tới.</p>
<p>Chúc bạn thành công!</p>
<p>Trân trọng,<br><strong>{{club_name}}</strong></p>',
        ],
        'passed' => [
            'name' => 'Template mặc định',
            'subject' => '[CKC IT CLUB] Chào mừng bạn gia nhập CKC IT CLUB!',
            'body' => '<p>Xin chào <strong>{{applicant_name}}</strong>,</p>
<p>Chúc mừng! Bạn đã chính thức trở thành thành viên của <strong>{{club_name}}</strong>.</p>
<p>Chúng tôi rất vui khi có bạn đồng hành. Ban Điều hành sẽ liên hệ để hướng dẫn các bước tiếp theo trong quá trình onboarding.</p>
<p>Hẹn gặp bạn tại các hoạt động sắp tới!</p>
<p>Trân trọng,<br><strong>{{club_name}}</strong></p>',
        ],
        'failed' => [
            'name' => 'Template mặc định',
            'subject' => '[CKC IT CLUB] Kết quả xét tuyển đơn ứng tuyển',
            'body' => '<p>Xin chào <strong>{{applicant_name}}</strong>,</p>
<p>Cảm ơn bạn đã quan tâm và gửi đơn ứng tuyển tham gia <strong>{{club_name}}</strong>.</p>
<p>Sau quá trình xét duyệt, rất tiếc chúng tôi chưa thể tiếp nhận bạn trong đợt tuyển thành viên này. Đây không phải là kết quả cuối cùng — chúng tôi hy vọng sẽ gặp lại bạn trong những đợt tuyển tiếp theo.</p>
<p>Chúc bạn nhiều may mắn và thành công!</p>
<p>Trân trọng,<br><strong>{{club_name}}</strong></p>',
        ],
    ];

    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        foreach ($this->types as $type) {
            $typeId = DB::table('mail_template_types')
                ->where('slug', $type['slug'])
                ->value('id');

            if (! $typeId) {
                $typeId = DB::table('mail_template_types')->insertGetId([
                    'slug' => $type['slug'],
                    'label' => $type['label'],
                    'description' => $type['description'],
                    'created_at' => now(),
                    'created_by' => $adminId,
                    'updated_at' => now(),
                    'updated_by' => $adminId,
                ]);
            }

            $defaultTemplate = $this->defaultTemplates[$type['slug']] ?? null;
            if (! $defaultTemplate) {
                continue;
            }

            $exists = DB::table('mail_templates')
                ->where('mail_template_type_id', $typeId)
                ->whereNull('deleted_at')
                ->exists();

            if (! $exists) {
                DB::table('mail_templates')->insert([
                    'mail_template_type_id' => $typeId,
                    'name' => $defaultTemplate['name'],
                    'subject' => $defaultTemplate['subject'],
                    'body' => $defaultTemplate['body'],
                    'is_default' => true,
                    'created_at' => now(),
                    'created_by' => $adminId,
                    'updated_at' => now(),
                    'updated_by' => $adminId,
                ]);
            }
        }
    }
}
