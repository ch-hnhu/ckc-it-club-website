<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserFollowSeeder extends Seeder
{
    public function run(): void
    {
        $ids = User::whereIn('email', array_merge(
            ['admin@gmail.com', 'clubmember@gmail.com'],
            array_map(fn (int $i) => "student{$i}@gmail.com", range(1, 10)),
        ))->pluck('id', 'email');

        if ($ids->count() < 3) {
            return;
        }

        // Cặp follow: [người theo dõi => danh sách người được theo dõi].
        $follows = [
            'student1@gmail.com'  => ['admin@gmail.com', 'student2@gmail.com', 'student3@gmail.com', 'student5@gmail.com'],
            'student2@gmail.com'  => ['admin@gmail.com', 'student1@gmail.com', 'student4@gmail.com'],
            'student3@gmail.com'  => ['student1@gmail.com', 'student2@gmail.com'],
            'student4@gmail.com'  => ['admin@gmail.com', 'student1@gmail.com'],
            'student5@gmail.com'  => ['student1@gmail.com', 'student7@gmail.com'],
            'student6@gmail.com'  => ['student1@gmail.com'],
            'student7@gmail.com'  => ['admin@gmail.com', 'student1@gmail.com', 'student9@gmail.com'],
            'student8@gmail.com'  => ['student2@gmail.com'],
            'student9@gmail.com'  => ['student1@gmail.com', 'student7@gmail.com'],
            'student10@gmail.com' => ['admin@gmail.com', 'student1@gmail.com'],
            'clubmember@gmail.com' => ['admin@gmail.com', 'student1@gmail.com', 'student2@gmail.com'],
        ];

        foreach ($follows as $followerEmail => $followingEmails) {
            $followerId = $ids[$followerEmail] ?? null;

            if (! $followerId) {
                continue;
            }

            foreach ($followingEmails as $followingEmail) {
                $followingId = $ids[$followingEmail] ?? null;

                if (! $followingId || $followingId === $followerId) {
                    continue;
                }

                DB::table('user_follows')->insertOrIgnore([
                    'follower_id'  => $followerId,
                    'following_id' => $followingId,
                    'created_at'   => now()->subDays(rand(1, 45)),
                ]);
            }
        }
    }
}
