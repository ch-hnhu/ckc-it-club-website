<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Dữ liệu demo cho tính năng kiểm duyệt AI:
 * - Đánh dấu các bài đăng/bình luận hiện có là "đã kiểm duyệt, hợp lệ".
 * - Tạo 1 bài đăng và 1 bình luận vi phạm bị AI ẩn kèm lý do,
 *   để demo màn hình quản trị kiểm duyệt nội dung.
 */
class ModerationDemoSeeder extends Seeder
{
    public function run(): void
    {
        $student = User::where('email', 'student8@gmail.com')->first();
        $channelId = DB::table('channels')->where('slug', 'goc-chia-se')->value('id');

        // 1. Nội dung hợp lệ hiện có: AI đã duyệt qua, không vi phạm.
        DB::table('posts')
            ->where('status', 'published')
            ->whereNull('moderated_at')
            ->update(['moderated_at' => now()->subDays(1)]);

        DB::table('comments')
            ->where('is_hidden', false)
            ->whereNull('moderated_at')
            ->update(['moderated_at' => now()->subDays(1)]);

        if (! $student || ! $channelId) {
            return;
        }

        // 2. Bài đăng vi phạm bị AI ẩn.
        $flaggedTitle = 'Bán tài khoản khóa học giá rẻ, ib ngay!!!';

        if (! DB::table('posts')->where('title', $flaggedTitle)->exists()) {
            DB::table('posts')->insert([
                'user_id'           => $student->id,
                'channel_id'        => $channelId,
                'title'             => $flaggedTitle,
                'content'           => "Mình có tài khoản premium các khóa học lập trình giá rẻ chỉ 50k, bao rẻ nhất thị trường. Ai mua inbox mình gấp, số lượng có hạn!!! Chuyển khoản trước nhận tài khoản sau.",
                'visibility'        => 'public',
                'status'            => 'hidden',
                'moderation_reason' => 'Nội dung quảng cáo/mua bán không phù hợp với quy định cộng đồng',
                'moderated_at'      => now()->subHours(5),
                'created_at'        => now()->subHours(6),
                'updated_at'        => now()->subHours(5),
            ]);
        }

        // 3. Bình luận vi phạm bị AI ẩn trên một bài đăng công khai.
        $postId = DB::table('posts')
            ->where('status', 'published')
            ->orderBy('id')
            ->value('id');

        $flaggedComment = 'Bài viết như này mà cũng đăng à, đúng là ngu dốt, phí thời gian đọc!';

        if ($postId && ! DB::table('comments')->where('content', $flaggedComment)->exists()) {
            DB::table('comments')->insert([
                'post_id'           => $postId,
                'user_id'           => $student->id,
                'parent_id'         => null,
                'content'           => $flaggedComment,
                'depth'             => 0,
                'is_hidden'         => true,
                'moderation_reason' => 'Ngôn từ xúc phạm, công kích cá nhân',
                'moderated_at'      => now()->subHours(3),
                'created_at'        => now()->subHours(4),
                'updated_at'        => now()->subHours(3),
            ]);
        }
    }
}
