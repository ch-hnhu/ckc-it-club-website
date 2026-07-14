<?php

namespace Database\Seeders;

use App\Models\Rank;
use Illuminate\Database\Seeder;

class RankSeeder extends Seeder
{
    public function run(): void
    {
        $ranks = [
            ['name' => 'Đồng', 'min_points' => 0, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/rank/level01.png'],
            ['name' => 'Bạc', 'min_points' => 100, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images//rank/level02.png'],
            ['name' => 'Vàng', 'min_points' => 300, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images//rank/level03.png'],
            ['name' => 'Bạch Kim', 'min_points' => 700, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images//rank/level04.png'],
            ['name' => 'Kim Cương', 'min_points' => 1500, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images//rank/level05.png'],
            ['name' => 'Tinh Anh', 'min_points' => 3000, 'badge' => 'https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images//rank/level06.png'],
        ];

        foreach ($ranks as $rank) {
            Rank::updateOrCreate(
                ['min_points' => $rank['min_points']],
                $rank,
            );
        }
    }
}
