<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MediaFileSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('email', 'admin@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin || empty($students)) {
            return;
        }

        // ── Lấy ID posts & blogs đã seed ──────────────────────────────────────
        $posts = DB::table('posts')
            ->whereIn('user_id', array_merge([$admin->id], $students))
            ->orderBy('id')
            ->pluck('id')
            ->toArray();

        $blogs = DB::table('blogs')
            ->whereIn('author_id', array_merge([$admin->id], $students))
            ->orderBy('id')
            ->pluck('id')
            ->toArray();

        if (empty($posts) && empty($blogs)) {
            return;
        }

        $rows = [];

        // ── Media cho Posts ────────────────────────────────────────────────────
        // Bài 1 (workshop ML): ảnh banner sự kiện
        if (isset($posts[1])) {
            $rows[] = [
                'owner_id'    => $admin->id,
                'url'         => 'https://picsum.photos/seed/workshop-ml/1200/630',
                'file_type'   => 'image',
                'size_kb'     => 420,
                'target_type' => 'post',
                'target_id'   => $posts[1],
                'created_at'  => now()->subDays(20),
                'updated_at'  => now()->subDays(20),
            ];
        }

        // Bài 3 (chia sẻ kinh nghiệm thực tập): ảnh minh hoạ
        if (isset($posts[4])) {
            $rows[] = [
                'owner_id'    => $students[2] ?? $students[0],
                'url'         => 'https://picsum.photos/seed/internship/1200/800',
                'file_type'   => 'image',
                'size_kb'     => 654,
                'target_type' => 'post',
                'target_id'   => $posts[4],
                'created_at'  => now()->subDays(8),
                'updated_at'  => now()->subDays(8),
            ];
        }

        // Bài 4 (Docker): ảnh chụp màn hình terminal
        if (isset($posts[5])) {
            $rows[] = [
                'owner_id'    => $students[3] ?? $students[0],
                'url'         => 'https://picsum.photos/seed/docker-setup/1280/720',
                'file_type'   => 'image',
                'size_kb'     => 298,
                'target_type' => 'post',
                'target_id'   => $posts[5],
                'created_at'  => now()->subDays(5),
                'updated_at'  => now()->subDays(5),
            ];
        }

        // Bài 2 (chào mừng thành viên): video clip ngắn
        if (isset($posts[0])) {
            $rows[] = [
                'owner_id'    => $admin->id,
                'url'         => 'https://www.w3schools.com/html/mov_bbb.mp4',
                'file_type'   => 'video',
                'size_kb'     => 7840,
                'target_type' => 'post',
                'target_id'   => $posts[0],
                'created_at'  => now()->subDays(30),
                'updated_at'  => now()->subDays(30),
            ];
        }

        // ── Media cho Blogs ────────────────────────────────────────────────────
        // Blog 1 (giới thiệu CLB): ảnh cover
        if (isset($blogs[0])) {
            $rows[] = [
                'owner_id'    => $admin->id,
                'url'         => 'https://picsum.photos/seed/clb-intro/1600/900',
                'file_type'   => 'image',
                'size_kb'     => 1024,
                'target_type' => 'blog',
                'target_id'   => $blogs[0],
                'created_at'  => now()->subDays(60),
                'updated_at'  => now()->subDays(60),
            ];
        }

        // Blog 2 (lộ trình web): ảnh roadmap
        if (isset($blogs[1])) {
            $rows[] = [
                'owner_id'    => $students[0] ?? $admin->id,
                'url'         => 'https://picsum.photos/seed/web-roadmap/1600/900',
                'file_type'   => 'image',
                'size_kb'     => 876,
                'target_type' => 'blog',
                'target_id'   => $blogs[1],
                'created_at'  => now()->subDays(20),
                'updated_at'  => now()->subDays(20),
            ];
        }

        // Blog 3 (Machine Learning): ảnh minh hoạ AI
        if (isset($blogs[2])) {
            $rows[] = [
                'owner_id'    => $students[1] ?? $admin->id,
                'url'         => 'https://picsum.photos/seed/machine-learning/1600/900',
                'file_type'   => 'image',
                'size_kb'     => 732,
                'target_type' => 'blog',
                'target_id'   => $blogs[2],
                'created_at'  => now()->subDays(10),
                'updated_at'  => now()->subDays(10),
            ];
        }

        // Blog 4 (Hackathon): ảnh kết quả + gif celebration
        if (isset($blogs[3])) {
            $rows[] = [
                'owner_id'    => $admin->id,
                'url'         => 'https://picsum.photos/seed/hackathon-2025/1600/900',
                'file_type'   => 'image',
                'size_kb'     => 1152,
                'target_type' => 'blog',
                'target_id'   => $blogs[3],
                'created_at'  => now()->subDays(5),
                'updated_at'  => now()->subDays(5),
            ];

            $rows[] = [
                'owner_id'    => $admin->id,
                'url'         => 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'file_type'   => 'gif',
                'size_kb'     => 2048,
                'target_type' => 'blog',
                'target_id'   => $blogs[3],
                'created_at'  => now()->subDays(5),
                'updated_at'  => now()->subDays(5),
            ];
        }

        // Blog 5 (Bảo mật web): ảnh bảo mật
        if (isset($blogs[4])) {
            $rows[] = [
                'owner_id'    => $students[2] ?? $admin->id,
                'url'         => 'https://picsum.photos/seed/web-security/1600/900',
                'file_type'   => 'image',
                'size_kb'     => 945,
                'target_type' => 'blog',
                'target_id'   => $blogs[4],
                'created_at'  => now()->subDays(3),
                'updated_at'  => now()->subDays(3),
            ];
        }

        // ── Insert (bỏ qua nếu đã tồn tại) ───────────────────────────────────
        foreach ($rows as $row) {
            DB::table('media_files')->insertOrIgnore($row);
        }
    }
}
