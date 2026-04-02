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
            'CĐ CK 25A', 'CĐ CK 25B', 'CĐ CK 25C',
            'CĐ ÔTÔ 25A', 'CĐ ÔTÔ 25B',
            'CĐ CNTT 25A', 'CĐ CNTT 25B', 'CĐ CNTT 25C',
            'CĐ ĐĐT 25A', 'CĐ ĐĐT 25B',
            'CĐ NL 25A', 'CĐ NL 25B',
            'CĐ ĐTTT 25A',
            'CĐ ĐKTĐ 25A',
            'CĐN CGKL 25A', 'CĐN SCCK 25A',
            'CĐN HÀN 25',
            'CĐN KTML 25A',
            'CĐN ÔTÔ 25A',
            'CĐN ĐCN 25A',
            'CĐN ĐTCN 25A',
            'CĐN QTM 25A',
            'CĐN SCMT 25',
        ];

        $majorMap = [
            'CK' => 'Cơ khí chế tạo',
            'CGKL' => 'Cơ khí chế tạo',
            'SCCK' => 'Sửa chữa cơ khí',
            'HÀN' => 'Hàn',
            'CNTT' => 'Công nghệ Thông tin',
            'TH' => 'Công nghệ Thông tin',
            'QTM' => 'Quản trị mạng máy tính',
            'SCMT' => 'Kỹ thuật sửa chữa, lắp ráp máy tính',
            'ÔTÔ' => 'Công nghệ Kỹ thuật Ô tô',
            'KTML' => 'Kỹ thuật máy lạnh và điều hòa không khí',
            'NL' => 'Công nghệ Kỹ thuật Nhiệt',
            'ĐCN' => 'Điện công nghiệp',
            'ĐTCN' => 'Điện tử công nghiệp',
            'ĐĐT' => 'Công nghệ Kỹ thuật Điện, Điện tử',
            'ĐTTT' => 'Công nghệ Kỹ thuật Điện tử - Viễn thông',
            'ĐKTĐ' => 'Công nghệ Kỹ thuật Điều khiển và Tự động hóa',
            'KTDN' => 'Kế toán doanh nghiệp',
        ];

        foreach ($classes as $className) {
            preg_match('/^CĐN?\s+([^\s]+)\s+/u', $className, $matches);
            $majorCode = $matches[1] ?? null;

            if (! $majorCode || ! isset($majorMap[$majorCode])) {
                continue;
            }

            $major = Major::where('slug', Str::slug($majorMap[$majorCode]))->first();

            if (! $major) {
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
