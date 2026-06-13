<?php

namespace Database\Seeders;

use App\Models\PointRule;
use Illuminate\Database\Seeder;

class PointRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            [
                'key' => 'blog.published',
                'name' => 'Xuất bản blog',
                'description' => 'Cộng điểm khi blog được xuất bản (mỗi blog tính 1 lần).',
                'points' => 15,
                'max_per_day' => null,
                'max_per_week' => null,
            ],
            [
                'key' => 'post.published',
                'name' => 'Đăng bài cộng đồng',
                'description' => 'Cộng điểm khi bài đăng cộng đồng được xuất bản (mỗi bài tính 1 lần).',
                'points' => 10,
                'max_per_day' => null,
                'max_per_week' => null,
            ],
            [
                'key' => 'comment.created',
                'name' => 'Bình luận',
                'description' => 'Cộng điểm khi tạo bình luận. Giới hạn để tránh spam.',
                'points' => 2,
                'max_per_day' => 10,
                'max_per_week' => null,
            ],
            [
                'key' => 'reaction.created',
                'name' => 'Thả cảm xúc',
                'description' => 'Cộng điểm khi thả cảm xúc. Giới hạn để tránh spam.',
                'points' => 1,
                'max_per_day' => 20,
                'max_per_week' => null,
            ],
        ];

        foreach ($rules as $rule) {
            PointRule::updateOrCreate(
                ['key' => $rule['key']],
                $rule + ['is_active' => true],
            );
        }
    }
}
