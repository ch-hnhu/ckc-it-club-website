<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReactionSeeder extends Seeder
{
    private array $types = ['heart'];

    public function run(): void
    {
        $admin    = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin || empty($students)) {
            return;
        }

        $allUserIds = array_merge($students, [$admin->id]);

        $postIds    = DB::table('posts')->where('status', 'published')->pluck('id')->toArray();
        $blogIds    = DB::table('blogs')->where('status', 'published')->pluck('id')->toArray();
        $commentIds = DB::table('comments')->pluck('id')->toArray();

        foreach ($postIds as $postId) {
            $reactors = array_slice($allUserIds, 0, rand(3, min(6, count($allUserIds))));
            foreach ($reactors as $userId) {
                DB::table('reactions')->updateOrInsert(
                    ['user_id' => $userId, 'target_type' => 'post', 'target_id' => $postId],
                    ['type' => $this->randomType(), 'created_at' => now()->subDays(rand(0, 10))]
                );
            }
        }

        foreach ($blogIds as $blogId) {
            $reactors = array_slice($allUserIds, 0, rand(4, min(8, count($allUserIds))));
            foreach ($reactors as $userId) {
                DB::table('reactions')->updateOrInsert(
                    ['user_id' => $userId, 'target_type' => 'blog', 'target_id' => $blogId],
                    ['type' => $this->randomType(), 'created_at' => now()->subDays(rand(0, 15))]
                );
            }
        }

        foreach (array_slice($commentIds, 0, 10) as $commentId) {
            $reactors = array_slice($allUserIds, 0, rand(1, min(4, count($allUserIds))));
            foreach ($reactors as $userId) {
                DB::table('reactions')->updateOrInsert(
                    ['user_id' => $userId, 'target_type' => 'comment', 'target_id' => $commentId],
                    ['type' => $this->randomType(), 'created_at' => now()->subDays(rand(0, 7))]
                );
            }
        }
    }

    private function randomType(): string
    {
        return $this->types[array_rand($this->types)];
    }
}
