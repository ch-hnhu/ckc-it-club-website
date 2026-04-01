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
            ['major' => 'Kỹ thuật Phần mềm', 'value' => 'CD22PM1'],
            ['major' => 'Kỹ thuật Phần mềm', 'value' => 'CD22PM2'],
            ['major' => 'Khoa học Máy tính', 'value' => 'CD22KHMT1'],
            ['major' => 'Mạng máy tính và Truyền thông dữ liệu', 'value' => 'CD22MMT1'],
            ['major' => 'Hệ thống thông tin', 'value' => 'CD22HTTT1'],
            ['major' => 'Trí tuệ Nhân tạo', 'value' => 'CD23AI1'],
            ['major' => 'Thương mại điện tử', 'value' => 'CD23TMĐT1'],
            ['major' => 'Marketing', 'value' => 'CD23MKT1'],
            ['major' => 'Thiết kế Đa phương tiện', 'value' => 'CD23TK1'],
            ['major' => 'Tiếng Anh thương mại', 'value' => 'CD23TATM1'],
        ];

        foreach ($classes as $class) {
            $major = Major::where('value', $class['major'])->first();

            if (!$major) {
                continue;
            }

            SchoolClass::firstOrCreate(
                ['value' => $class['value']],
                [
                    'label' => $class['value'],
                    'slug' => Str::slug($class['value']),
                    'major_id' => $major->id,
                ]
            );
        }
    }
}
