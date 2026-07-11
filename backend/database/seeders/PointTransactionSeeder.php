<?php

namespace Database\Seeders;

use App\Models\PointRule;
use App\Models\Rank;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Sinh lịch sử điểm thưởng cho các tài khoản demo để bảng xếp hạng
 * có dữ liệu trải đều các rank (Đồng → Bạch Kim).
 */
class PointTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $rules = PointRule::pluck('id', 'key');

        if ($rules->isEmpty()) {
            return;
        }

        // Số lần đạt từng rule của mỗi tài khoản demo — tổng điểm quyết định rank.
        $activities = [
            // ~760 điểm → Bạch Kim
            'student1@gmail.com' => [
                'event.checkin' => 6, 'blog.published' => 6, 'post.published' => 10,
                'learning_center.course_completed' => 2, 'learning_center.quiz_passed' => 8,
                'learning_center.video_completed' => 12, 'learning_center.assignment_completed' => 6,
                'comment.created' => 40, 'reaction.created' => 10,
            ],
            // ~460 điểm → Vàng
            'student2@gmail.com' => [
                'event.checkin' => 4, 'blog.published' => 4, 'post.published' => 8,
                'learning_center.course_completed' => 1, 'learning_center.quiz_passed' => 6,
                'learning_center.video_completed' => 8, 'comment.created' => 25, 'reaction.created' => 20,
            ],
            // ~330 điểm → Vàng
            'student3@gmail.com' => [
                'event.checkin' => 3, 'blog.published' => 2, 'post.published' => 6,
                'learning_center.course_completed' => 1, 'learning_center.quiz_passed' => 4,
                'comment.created' => 15, 'reaction.created' => 10,
            ],
            // ~240 điểm → Bạc
            'student4@gmail.com' => [
                'event.checkin' => 3, 'blog.published' => 2, 'post.published' => 4,
                'learning_center.quiz_passed' => 3, 'comment.created' => 20, 'reaction.created' => 10,
            ],
            // ~160 điểm → Bạc
            'student5@gmail.com' => [
                'event.checkin' => 2, 'blog.published' => 1, 'post.published' => 3,
                'learning_center.video_completed' => 5, 'comment.created' => 10, 'reaction.created' => 10,
            ],
            // ~110 điểm → Bạc
            'student6@gmail.com' => [
                'event.checkin' => 1, 'post.published' => 3, 'learning_center.video_completed' => 4,
                'comment.created' => 10, 'reaction.created' => 10,
            ],
            // Các tài khoản còn lại → Đồng
            'student7@gmail.com' => [
                'event.checkin' => 1, 'post.published' => 2, 'comment.created' => 10, 'reaction.created' => 15,
            ],
            'student8@gmail.com' => [
                'event.checkin' => 1, 'post.published' => 1, 'comment.created' => 8, 'reaction.created' => 4,
            ],
            'student9@gmail.com' => [
                'post.published' => 2, 'comment.created' => 6, 'reaction.created' => 8,
            ],
            'student10@gmail.com' => [
                'post.published' => 1, 'comment.created' => 5, 'reaction.created' => 5,
            ],
            // ~140 điểm → Bạc
            'clubmember@gmail.com' => [
                'event.checkin' => 2, 'post.published' => 4, 'comment.created' => 15, 'reaction.created' => 10,
            ],
        ];

        $rulePoints = PointRule::pluck('points', 'key');

        foreach ($activities as $email => $counts) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                continue;
            }

            // Idempotent: user đã có lịch sử điểm thì bỏ qua.
            if (DB::table('point_transactions')->where('user_id', $user->id)->exists()) {
                continue;
            }

            $total = 0;
            $rows = [];

            foreach ($counts as $ruleKey => $count) {
                $ruleId = $rules[$ruleKey] ?? null;
                $points = $rulePoints[$ruleKey] ?? null;

                if (! $ruleId || $points === null) {
                    continue;
                }

                for ($i = 0; $i < $count; $i++) {
                    // 30% giao dịch rơi vào tuần hiện tại để leaderboard tuần có dữ liệu.
                    $createdAt = rand(1, 100) <= 30
                        ? now()->subDays(rand(0, 6))->subMinutes(rand(0, 1440))
                        : now()->subDays(rand(7, 55))->subMinutes(rand(0, 1440));

                    $rows[] = [
                        'user_id'       => $user->id,
                        'point_rule_id' => $ruleId,
                        'points'        => $points,
                        'source_type'   => null,
                        'source_id'     => null,
                        'metadata'      => null,
                        'created_at'    => $createdAt,
                        'updated_at'    => $createdAt,
                    ];
                    $total += $points;
                }
            }

            DB::table('point_transactions')->insert($rows);

            // Đồng bộ tổng điểm và rank giống PointService::award().
            $user->total_points = $total;
            $user->rank_id = Rank::where('min_points', '<=', $total)
                ->orderByDesc('min_points')
                ->value('id');
            $user->save();
        }
    }
}
