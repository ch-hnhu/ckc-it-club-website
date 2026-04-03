<?php

namespace Database\Seeders;

use App\Models\Major;
use App\Models\SchoolClass;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            
            // ===== CD 23 =====
            'CĐ CK 23A','CĐ CK 23B','CĐ CK 23C','CĐ CK 23D','CĐ CK 23E',
            'CĐ ÔTÔ 23A','CĐ ÔTÔ 23B','CĐ ÔTÔ 23C','CĐ ÔTÔ 23D','CĐ ÔTÔ 23E',
            'CĐ NL 23A','CĐ NL 23B','CĐ NL 23C','CĐ NL 23D','CĐ NL 23E',
            'CĐ TH 23MMTA','CĐ TH 23WEBB','CĐ TH 23WEBC','CĐ TH 23DĐD','CĐ TH 23DĐE',
            'CĐ CĐT 23A','CĐ CĐT 23B',
            'CĐ ĐTTT 23VT','CĐ ĐTTT 23MT',
            'CĐ ĐKTĐ 23A','CĐ ĐKTĐ 23B','CĐ ĐKTĐ 23C',
            'CĐ ĐĐT 23ĐA','CĐ ĐĐT 23ĐB','CĐ ĐĐT 23ĐC','CĐ ĐĐT 23ĐTD','CĐ ĐĐT 23ĐTE',
            'CĐ KTDN 23A','CĐ KTDN 23B',

            // ===== CD 24 =====
            'CĐ CK 24A','CĐ CK 24B','CĐ CK 24C','CĐ CK 24D','CĐ CK 24E',
            'CĐ ÔTÔ 24A','CĐ ÔTÔ 24B','CĐ ÔTÔ 24C','CĐ ÔTÔ 24D','CĐ ÔTÔ 24E',
            'CĐ NL 24A','CĐ NL 24B','CĐ NL 24C','CĐ NL 24D',
            'CĐ CNTT 24A','CĐ CNTT 24B','CĐ CNTT 24C','CĐ CNTT 24D','CĐ CNTT 24E','CĐ CNTT 24F',
            'CĐ CNTT 24MMT','CĐ CNTT 24AI','CĐ CNTT 24WEBC','CĐ CNTT 24WEBD','CĐ CNTT 24DĐ',
            'CĐ CĐT 24A','CĐ CĐT 24B',
            'CĐ ĐTTT 24A','CĐ ĐTTT 24B',
            'CĐ ĐKTĐ 24A','CĐ ĐKTĐ 24B','CĐ ĐKTĐ 24C',
            'CĐ ĐĐT 24A','CĐ ĐĐT 24B','CĐ ĐĐT 24C','CĐ ĐĐT 24D','CĐ ĐĐT 24E','CĐ ĐĐT 24F','CĐ ĐĐT 24G','CĐ ĐĐT 24H',
            'CĐ KTDN 24A','CĐ KTDN 24B',

            // ===== CD 25 =====
            'CĐ CK 25A','CĐ CK 25B','CĐ CK 25C','CĐ CK 25D','CĐ CK 25E',
            'CĐ ÔTÔ 25A','CĐ ÔTÔ 25B','CĐ ÔTÔ 25C','CĐ ÔTÔ 25D','CĐ ÔTÔ 25E',
            'CĐ NL 25A','CĐ NL 25B','CĐ NL 25C','CĐ NL 25D',
            'CĐ CNTT 25A','CĐ CNTT 25B','CĐ CNTT 25C','CĐ CNTT 25D','CĐ CNTT 25E','CĐ CNTT 25F',
            'CĐ CĐT 25A','CĐ CĐT 25B',
            'CĐ ĐTTT 25A','CĐ ĐTTT 25B',
            'CĐ ĐKTĐ 25A','CĐ ĐKTĐ 25B',
            'CĐ ĐĐT 25A','CĐ ĐĐT 25B','CĐ ĐĐT 25C','CĐ ĐĐT 25D','CĐ ĐĐT 25E','CĐ ĐĐT 25F','CĐ ĐĐT 25G','CĐ ĐĐT 25H',
            'CĐ KTDN 25A','CĐ KTDN 25B',

            // ===== CDN 23 =====
            'CĐN CGKL 23A','CĐN CGKL 23B',
            'CĐN SCCK 23',
            'CĐN HÀN 23',
            'CĐN KTML 23A','CĐN KTML 23B',
            'CĐN ÔTÔ 23A','CĐN ÔTÔ 23B','CĐN ÔTÔ 23C','CĐN ÔTÔ 23D',
            'CĐN ĐCN 23A','CĐN ĐCN 23B','CĐN ĐCN 23C','CĐN ĐCN 23D',
            'CĐN ĐTCN 23A','CĐN ĐTCN 23B',
            'CĐN QTM 23A','CĐN QTM 23B',
            'CĐN SCMT 23',

            // ===== CDN 24 =====
            'CĐN CGKL 24A','CĐN CGKL 24B',
            'CĐN SCCK 24',
            'CĐN HÀN 24',
            'CĐN KTML 24A','CĐN KTML 24B','CĐN KTML 24C',
            'CĐN ÔTÔ 24A','CĐN ÔTÔ 24B','CĐN ÔTÔ 24C','CĐN ÔTÔ 24D','CĐN ÔTÔ 24E',
            'CĐN ĐCN 24A','CĐN ĐCN 24B','CĐN ĐCN 24C','CĐN ĐCN 24D','CĐN ĐCN 24E',
            'CĐN ĐTCN 24A','CĐN ĐTCN 24B',
            'CĐN QTM 24',
            'CĐN SCMT 24',

            // ===== CDN 25 =====
            'CĐN CGKL 25A','CĐN CGKL 25B',
            'CĐN SCCK 25A','CĐN SCCK 25B',
            'CĐN HÀN 25',
            'CĐN KTML 25A','CĐN KTML 25B','CĐN KTML 25C',
            'CĐN ÔTÔ 25A','CĐN ÔTÔ 25B','CĐN ÔTÔ 25C','CĐN ÔTÔ 25D',
            'CĐN ĐCN 25A','CĐN ĐCN 25B','CĐN ĐCN 25C','CĐN ĐCN 25D',
            'CĐN ĐTCN 25A','CĐN ĐTCN 25B',
            'CĐN QTM 25A','CĐN QTM 25B',
            'CĐN SCMT 25',
        ];

        // mapping chuẩn theo MajorSeeder để tìm đúng ngành cho từng lớp
        $majorMap = [
            'CK'   => 'Cơ khí chế tạo',
            'CGKL' => 'Cơ khí chế tạo',
            'SCCK' => 'Sửa chữa cơ khí',
            'HÀN'  => 'Hàn',

            'CNTT' => 'Công nghệ Thông tin',
            'TH'   => 'Công nghệ Thông tin',

            'QTM'  => 'Quản trị mạng máy tính',
            'SCMT' => 'Kỹ thuật sửa chữa, lắp ráp máy tính',

            'ÔTÔ'  => 'Công nghệ Kỹ thuật Ô tô',

            'KTML' => 'Kỹ thuật máy lạnh và điều hòa không khí',
            'NL'   => 'Công nghệ Kỹ thuật Nhiệt',

            'ĐCN'  => 'Điện công nghiệp',
            'ĐTCN' => 'Điện tử công nghiệp',

            'ĐĐT'  => 'Công nghệ Kỹ thuật Điện, Điện tử',
            'ĐTTT' => 'Công nghệ Kỹ thuật Điện tử - Viễn thông',

            'ĐKTĐ' => 'Công nghệ Kỹ thuật Điều khiển và Tự động hóa',
            'CĐT'  => 'Công nghệ Kỹ thuật Cơ điện tử',

            'KTDN' => 'Kế toán doanh nghiệp',
        ];

        foreach ($classes as $className) {
            preg_match('/^CĐN?\s+([^\s]+)/u', $className, $matches);
            $majorCode = $matches[1] ?? null;

            if (!$majorCode || !isset($majorMap[$majorCode])) {
                continue;
            }

            $major = Major::where('slug', Str::slug($majorMap[$majorCode]))->first();

            if (!$major) {
                $this->command?->warn("Không tìm thấy ngành cho lớp {$className}: {$majorMap[$majorCode]}");
                continue;
            }

            SchoolClass::updateOrCreate(
                ['slug' => Str::slug($className)],
                [
                    'value' => $className,
                    'label' => $className,
                    'major_id' => $major->id,
                ]
            );
        }
    }
}
