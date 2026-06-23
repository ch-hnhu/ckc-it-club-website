<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Mẫu chứng chỉ mặc định để CourseCertificateService có thể sinh PDF khi học viên
 * hoàn thành khoá học. Placeholder hỗ trợ: {{name}}, {{course}}, {{cert_code}}, {{issued_at}}.
 */
class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('certificate_templates')->where('is_default', true)->exists()) {
            return;
        }

        $adminId = User::query()->orderBy('id')->value('id');
        if (! $adminId) {
            return;
        }

        DB::table('certificate_templates')->insert([
            'name' => 'Mẫu mặc định',
            'html_content' => <<<'HTML'
<div style="width:780px;padding:60px;border:10px solid #1d4ed8;font-family:DejaVu Sans, sans-serif;text-align:center;">
    <p style="font-size:14px;letter-spacing:4px;color:#1d4ed8;text-transform:uppercase;">CLB IT Trường Cao Đẳng Kỹ Thuật Cao Thắng</p>
    <h1 style="font-size:36px;margin:20px 0 0;">CHỨNG NHẬN HOÀN THÀNH</h1>
    <p style="font-size:16px;margin-top:30px;">Chứng nhận học viên</p>
    <p style="font-size:28px;font-weight:bold;margin:10px 0;">{{name}}</p>
    <p style="font-size:16px;">đã hoàn thành khoá học</p>
    <p style="font-size:22px;font-weight:bold;margin:10px 0 30px;">{{course}}</p>
    <p style="font-size:13px;color:#555;">Ngày cấp: {{issued_at}}</p>
    <p style="font-size:13px;color:#555;">Mã xác minh: {{cert_code}}</p>
</div>
HTML,
            'thumbnail' => null,
            'is_default' => true,
            'created_by' => $adminId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
