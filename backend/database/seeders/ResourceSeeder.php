<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $clubMember = User::where('email', 'clubmember@gmail.com')->first();
        $reporter = User::where('email', 'user@gmail.com')->first();
        $students = User::where('email', 'like', 'student%@gmail.com')->pluck('id')->toArray();

        if (! $admin) {
            return;
        }

        $resources = [
            [
                'uploader_id' => $admin->id,
                'title' => 'Slide nhập môn Git & GitHub',
                'description' => 'Slide hướng dẫn Git cơ bản: clone, commit, branch, pull request cho thành viên mới.',
                'link_type' => 'google_drive',
                'url' => 'https://drive.google.com/file/d/1a2b3c4d5e6f/view',
                'status' => 'published',
                'click_count' => 128,
                'days_ago' => 20,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $students[0] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Bộ đề luyện thi vòng loại CLB',
                'description' => 'Tổng hợp đề thi các năm trước dùng để luyện tập trước vòng tuyển thành viên mới.',
                'link_type' => 'document',
                'url' => 'https://drive.google.com/file/d/de-thi-vong-loai/view',
                'status' => 'published',
                'click_count' => 76,
                'days_ago' => 15,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $students[1] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Kho tài liệu ReactJS chính thức',
                'description' => 'Link tài liệu ReactJS chính thức, phù hợp cho người mới học frontend.',
                'link_type' => 'other',
                'url' => 'https://react.dev/learn',
                'status' => 'published',
                'click_count' => 203,
                'days_ago' => 12,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $clubMember?->id ?? $admin->id,
                'title' => 'Video hướng dẫn deploy Laravel lên VPS',
                'description' => 'Video từng bước deploy ứng dụng Laravel lên VPS Ubuntu bằng Nginx và Supervisor.',
                'link_type' => 'youtube',
                'url' => 'https://youtube.com/watch?v=deploy-laravel-vps',
                'status' => 'published',
                'click_count' => 95,
                'days_ago' => 9,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $students[2] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Source code mẫu API RESTful với Laravel Sanctum',
                'description' => 'Repo mẫu triển khai xác thực token với Laravel Sanctum, có sẵn Postman collection.',
                'link_type' => 'github',
                'url' => 'https://github.com/ckc-it-club/laravel-sanctum-example',
                'status' => 'published',
                'click_count' => 61,
                'days_ago' => 6,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $clubMember?->id ?? $admin->id,
                'title' => 'Slide buổi sinh hoạt tháng 6',
                'description' => 'Slide tổng kết hoạt động và định hướng tháng 7 của CLB.',
                'link_type' => 'document',
                'url' => 'https://drive.google.com/file/d/slide-thang-6/view',
                'status' => 'pending_review',
                'click_count' => 0,
                'days_ago' => 1,
                'reviewed' => false,
            ],
            [
                'uploader_id' => $students[3] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Checklist chuẩn bị đồ án tốt nghiệp',
                'description' => 'Bảng checklist các mốc thời gian và đầu việc cần hoàn thành khi làm đồ án tốt nghiệp.',
                'link_type' => 'document',
                'url' => 'https://drive.google.com/file/d/checklist-do-an/view',
                'status' => 'pending_review',
                'click_count' => 0,
                'days_ago' => 0,
                'reviewed' => false,
            ],
            [
                'uploader_id' => $students[0] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Link khóa học ngoại ngữ miễn phí không liên quan CLB',
                'description' => 'Chia sẻ khóa học tiếng Anh miễn phí.',
                'link_type' => 'other',
                'url' => 'https://example.com/free-english-course',
                'status' => 'rejected',
                'click_count' => 0,
                'days_ago' => 10,
                'reviewed' => true,
            ],
            [
                'uploader_id' => $students[1] ?? $clubMember?->id ?? $admin->id,
                'title' => 'Tài liệu ôn tập cấu trúc dữ liệu (đã bị report)',
                'description' => 'Tổng hợp lý thuyết và bài tập cấu trúc dữ liệu & giải thuật.',
                'link_type' => 'document',
                'url' => 'https://drive.google.com/file/d/ctdl-on-tap/view',
                'status' => 'hidden',
                'click_count' => 42,
                'days_ago' => 18,
                'reviewed' => true,
                'hide_reason' => 'Tài liệu chứa nội dung sao chép không ghi nguồn theo báo cáo của thành viên.',
            ],
        ];

        $resourceIds = [];

        foreach ($resources as $item) {
            if (DB::table('resources')->where('title', $item['title'])->exists()) {
                continue;
            }

            $daysAgo = $item['days_ago'];

            $resourceIds[$item['title']] = DB::table('resources')->insertGetId([
                'uploader_id' => $item['uploader_id'],
                'title' => $item['title'],
                'description' => $item['description'],
                'link_type' => $item['link_type'],
                'url' => $item['url'],
                'status' => $item['status'],
                'click_count' => $item['click_count'],
                'reviewed_by' => $item['reviewed'] ? $admin->id : null,
                'reviewed_at' => $item['reviewed'] ? now()->subDays($daysAgo) : null,
                'created_at' => now()->subDays($daysAgo + 1),
                'updated_at' => now()->subDays(max(0, $daysAgo - 1)),
            ]);
        }

        if (! $reporter) {
            return;
        }

        $reports = [
            [
                'resource_title' => 'Kho tài liệu ReactJS chính thức',
                'reason' => 'broken_link',
                'description' => 'Link không mở được, báo lỗi 404.',
                'status' => 'pending',
                'days_ago' => 2,
            ],
            [
                'resource_title' => 'Tài liệu ôn tập cấu trúc dữ liệu (đã bị report)',
                'reason' => 'copyright',
                'description' => 'Nội dung copy từ sách mà không ghi nguồn tác giả.',
                'status' => 'resolved_hidden',
                'resolution_note' => 'Tài liệu chứa nội dung sao chép không ghi nguồn theo báo cáo của thành viên.',
                'days_ago' => 18,
            ],
        ];

        foreach ($reports as $report) {
            $resourceId = $resourceIds[$report['resource_title']]
                ?? DB::table('resources')->where('title', $report['resource_title'])->value('id');

            if (! $resourceId) {
                continue;
            }

            $exists = DB::table('resource_reports')
                ->where('resource_id', $resourceId)
                ->where('reporter_id', $reporter->id)
                ->exists();

            if ($exists) {
                continue;
            }

            $daysAgo = $report['days_ago'];

            DB::table('resource_reports')->insert([
                'resource_id' => $resourceId,
                'reporter_id' => $reporter->id,
                'reason' => $report['reason'],
                'description' => $report['description'],
                'status' => $report['status'],
                'resolution_note' => $report['resolution_note'] ?? null,
                'resolved_by' => $report['status'] !== 'pending' ? $admin->id : null,
                'resolved_at' => $report['status'] !== 'pending' ? now()->subDays($daysAgo) : null,
                'created_at' => now()->subDays($daysAgo + 1),
                'updated_at' => now()->subDays(max(0, $daysAgo - 1)),
            ]);
        }
    }
}
