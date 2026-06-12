<?php

namespace Database\Seeders;

use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'Đồng', 'min_points' => 0, 'badge' => '/assets/img/level01.png'],
            ['name' => 'Bạc', 'min_points' => 100, 'badge' => '/assets/img/level02.png'],
            ['name' => 'Vàng', 'min_points' => 300, 'badge' => '/assets/img/level03.png'],
            ['name' => 'Bạch Kim', 'min_points' => 700, 'badge' => '/assets/img/level04.png'],
            ['name' => 'Kim Cương', 'min_points' => 1500, 'badge' => '/assets/img/level05.png'],
            ['name' => 'Tinh Anh', 'min_points' => 3000, 'badge' => '/assets/img/level06.png'],
        ];

        foreach ($levels as $level) {
            Level::updateOrCreate(
                ['min_points' => $level['min_points']],
                $level,
            );
        }
    }
}
