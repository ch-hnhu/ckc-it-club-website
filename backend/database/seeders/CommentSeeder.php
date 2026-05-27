<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CommentSeeder extends Seeder
{
    private array $topComments = [
        'Bài viết rất hay và bổ ích! Cảm ơn bạn đã chia sẻ.',
        'Mình cũng đang gặp vấn đề tương tự, cảm ơn đã đặt câu hỏi.',
        'Thông tin rất hữu ích, mình sẽ thử áp dụng ngay.',
        'CLB mình quá xịn luôn, mọi người tích cực quá!',
        'Có thể chia sẻ thêm tài liệu liên quan không bạn?',
        'Workshop này hay quá, mình đăng ký rồi!',
        'Cảm ơn admin đã tổng hợp thông tin đầy đủ như vậy.',
        'Mình đã áp dụng theo và thành công rồi, thanks bạn nhiều!',
    ];

    private array $replyComments = [
        'Cảm ơn bạn đã ủng hộ! Mình sẽ chia sẻ thêm sau nhé.',
        'Đúng vậy bạn ơi, mình cũng nghĩ thế!',
        'Bạn có thể inbox mình để mình chia sẻ thêm nhé.',
        'Rất vui khi bạn thấy hữu ích!',
        'Bạn thử cách này xem: kiểm tra lại cấu hình file .env trước.',
    ];

    public function run(): void
    {
        $admin    = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin || empty($students)) {
            return;
        }

        $allUserIds = array_merge($students, [$admin->id]);
        $posts      = DB::table('posts')->where('status', 'published')->get();

        if ($posts->isEmpty()) {
            return;
        }

        foreach ($posts as $post) {
            $parentIds = [];

            // 2–4 top-level comments per post
            $commenters = array_slice($allUserIds, 0, rand(2, min(4, count($allUserIds))));
            shuffle($commenters);

            foreach ($commenters as $i => $userId) {
                $alreadyCommented = DB::table('comments')
                    ->where('post_id', $post->id)
                    ->where('user_id', $userId)
                    ->where('depth', 0)
                    ->exists();

                if ($alreadyCommented) {
                    continue;
                }

                $commentId = DB::table('comments')->insertGetId([
                    'post_id'    => $post->id,
                    'user_id'    => $userId,
                    'parent_id'  => null,
                    'content'    => $this->topComments[$i % count($this->topComments)],
                    'depth'      => 0,
                    'created_at' => now()->subDays(rand(1, 10)),
                    'updated_at' => now()->subDays(rand(0, 3)),
                ]);

                $parentIds[] = $commentId;
            }

            // 1 reply on the first comment of each post
            if (! empty($parentIds)) {
                $replyUserId = $allUserIds[array_rand($allUserIds)];
                DB::table('comments')->insert([
                    'post_id'    => $post->id,
                    'user_id'    => $replyUserId,
                    'parent_id'  => $parentIds[0],
                    'content'    => $this->replyComments[array_rand($this->replyComments)],
                    'depth'      => 1,
                    'created_at' => now()->subDays(rand(0, 3)),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
