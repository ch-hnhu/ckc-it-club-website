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
        $major = Major::where('value', 'Kỹ thuật Phần mềm')->first();
        if (!$major) return;

        $classes = [
            'CD22KT1',
            'CD22KT2',
            'CD23KT1',
            'CD23KT2',
            'CD24KT1',
        ];

        foreach ($classes as $class) {
            SchoolClass::firstOrCreate(
                ['value' => $class],
                [
                    'label' => $class,
                    'slug' => Str::slug($class),
                    'major_id' => $major->id,
                ]
            );
        }
    }
}
