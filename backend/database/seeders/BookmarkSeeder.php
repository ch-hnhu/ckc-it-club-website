<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BookmarkSeeder extends Seeder
{
    public function run(): void
    {
        $students = User::where('email', 'like', 'student%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->values();

        if ($students->isEmpty()) {
            return;
        }

        $postIds = DB::table('posts')->where('status', 'published')->orderBy('id')->pluck('id');
        $blogIds = DB::table('blogs')->where('status', 'published')->orderBy('id')->pluck('id');

        // Mỗi bài đăng/blog được 1–3 sinh viên lưu lại.
        foreach ($postIds as $i => $postId) {
            foreach ($students->slice($i % $students->count(), 1 + ($i % 3)) as $userId) {
                DB::table('post_bookmarks')->insertOrIgnore([
                    'post_id'    => $postId,
                    'user_id'    => $userId,
                    'created_at' => now()->subDays(rand(0, 14)),
                    'updated_at' => now(),
                ]);
            }
        }

        foreach ($blogIds as $i => $blogId) {
            foreach ($students->slice(($i + 2) % $students->count(), 1 + ($i % 3)) as $userId) {
                DB::table('blog_bookmarks')->insertOrIgnore([
                    'blog_id'    => $blogId,
                    'user_id'    => $userId,
                    'created_at' => now()->subDays(rand(0, 14)),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
