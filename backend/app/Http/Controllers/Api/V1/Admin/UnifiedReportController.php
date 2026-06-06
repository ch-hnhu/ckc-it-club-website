<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\BlogReport;
use App\Models\PostReport;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnifiedReportController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $page    = max(1, (int) $request->query('page', 1));
        $status  = $request->query('status');
        $search  = $request->query('search');
        $type    = $request->query('type'); // 'post' | 'blog' | null = all

        $allowedSorts = ['id', 'type', 'content_title', 'reporter_name', 'reason', 'description', 'status', 'created_at'];
        $sort  = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at') : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc') : 'desc';

        $merged = collect();

        // ── Post reports ──────────────────────────────────────────────────────
        if (! $type || $type === 'post') {
            $q = PostReport::with([
                'post:id,title,status',
                'reporter:id,full_name,email,username',
                'resolver:id,full_name',
            ]);
            if ($status && $status !== 'all') {
                $q->where('status', $status);
            }
            if ($search) {
                $q->whereHas('reporter', fn ($r) => $r
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email',     'like', "%{$search}%")
                );
            }
            $merged = $merged->concat(
                $q->get()->map(fn (PostReport $r) => $this->transformPost($r))
            );
        }

        // ── Blog reports ──────────────────────────────────────────────────────
        if (! $type || $type === 'blog') {
            $q = BlogReport::with([
                'blog:id,slug,title,status',
                'reporter:id,full_name,email,username',
                'resolver:id,full_name',
            ]);
            if ($status && $status !== 'all') {
                $q->where('status', $status);
            }
            if ($search) {
                $q->whereHas('reporter', fn ($r) => $r
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email',     'like', "%{$search}%")
                );
            }
            $merged = $merged->concat(
                $q->get()->map(fn (BlogReport $r) => $this->transformBlog($r))
            );
        }

        // ── Sort ──────────────────────────────────────────────────────────────
        $keyFn = match ($sort) {
            'content_title' => fn ($r) => mb_strtolower($r['content']['title'] ?? ''),
            'reporter_name' => fn ($r) => mb_strtolower($r['reporter']['full_name'] ?? ''),
            'type'          => fn ($r) => $r['type'],
            default         => fn ($r) => $r[$sort] ?? '',
        };

        $sorted = $order === 'asc'
            ? $merged->sortBy($keyFn)->values()
            : $merged->sortByDesc($keyFn)->values();

        // ── Paginate ──────────────────────────────────────────────────────────
        $total    = $sorted->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $items    = $sorted->skip(($page - 1) * $perPage)->take($perPage)->values();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách báo cáo thành công.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'per_page'     => $perPage,
                'total'        => $total,
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        return $this->successResponse(true, [
            'total'     => PostReport::count() + BlogReport::count(),
            'pending'   => PostReport::where('status', 'pending')->count()   + BlogReport::where('status', 'pending')->count(),
            'reviewing' => PostReport::where('status', 'reviewing')->count() + BlogReport::where('status', 'reviewing')->count(),
            'resolved'  => PostReport::where('status', 'resolved')->count()  + BlogReport::where('status', 'resolved')->count(),
            'dismissed' => PostReport::where('status', 'dismissed')->count() + BlogReport::where('status', 'dismissed')->count(),
            'post'      => PostReport::count(),
            'blog'      => BlogReport::count(),
        ], 'Lấy thống kê thành công.');
    }

    public function updateStatus(Request $request, string $type, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,reviewing,resolved,dismissed'],
        ]);

        $status  = $request->input('status');
        $userId  = $request->user()->id;
        $admin   = $request->user();
        $payload = ['status' => $status];

        if (in_array($status, ['resolved', 'dismissed'])) {
            $payload['resolved_by'] = $userId;
            $payload['resolved_at'] = now();
        }

        $statusLabel = match ($status) {
            'pending'   => 'chờ xử lý',
            'reviewing' => 'đang xem xét',
            'resolved'  => 'đã xử lý',
            'dismissed' => 'đã bỏ qua',
            default     => $status,
        };

        if ($type === 'post') {
            $report = PostReport::findOrFail($id);
            $report->update($payload);
            $report->load(['post:id,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

            $contentTitle = $report->post?->title ?? 'Bài viết đã xóa';
            NotificationService::dispatch(
                title: 'Trạng thái báo cáo được cập nhật',
                message: "{$admin->full_name} đã cập nhật báo cáo bài viết \"{$contentTitle}\" thành {$statusLabel}.",
                action: 'status_changed',
                entityType: 'post_report',
                entityId: $report->id,
                performedBy: $admin->full_name,
                link: '/community/reports',
                excludeUserId: $userId,
            );

            return $this->successResponse(true, $this->transformPost($report), 'Cập nhật trạng thái thành công.');
        }

        $report = BlogReport::findOrFail($id);
        $report->update($payload);
        $report->load(['blog:id,slug,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        $contentTitle = $report->blog?->title ?? 'Blog đã xóa';
        NotificationService::dispatch(
            title: 'Trạng thái báo cáo được cập nhật',
            message: "{$admin->full_name} đã cập nhật báo cáo blog \"{$contentTitle}\" thành {$statusLabel}.",
            action: 'status_changed',
            entityType: 'blog_report',
            entityId: $report->id,
            performedBy: $admin->full_name,
            link: '/community/reports',
            excludeUserId: $userId,
        );

        return $this->successResponse(true, $this->transformBlog($report), 'Cập nhật trạng thái thành công.');
    }

    public function hideContent(Request $request, string $type, int $id): JsonResponse
    {
        $now    = now();
        $userId = $request->user()->id;

        if ($type === 'post') {
            $report = PostReport::with('post')->findOrFail($id);
            if (! $report->post) {
                return $this->errorResponse(false, 'Bài viết không tồn tại.', 404);
            }

            // Collect all unique reporters BEFORE bulk update
            $reporterIds = PostReport::where('post_id', $report->post_id)
                ->pluck('reporter_id')->unique();
            $reporters = User::whereIn('id', $reporterIds)->get();

            $report->post->update(['status' => 'hidden']);

            // Bulk-resolve every report for this post
            PostReport::where('post_id', $report->post_id)
                ->update(['status' => 'resolved', 'resolved_by' => $userId, 'resolved_at' => $now]);

            $report->refresh()->load(['post:id,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

            $contentTitle = $report->post?->title ?? 'Bài viết đã xóa';
            $admin        = $request->user();

            // Notify all reporters (user-facing, real-time WebSocket)
            foreach ($reporters as $reporter) {
                UserNotificationService::dispatchReportResolved($reporter, $admin, 'post', $contentTitle);
            }

            // Notify other admins
            NotificationService::dispatch(
                title: 'Nội dung vi phạm đã bị ẩn',
                message: "{$admin->full_name} đã ẩn bài viết \"{$contentTitle}\" và đánh dấu tất cả báo cáo liên quan là Đã xử lý.",
                action: 'status_changed',
                entityType: 'post_report',
                entityId: $report->id,
                performedBy: $admin->full_name,
                link: '/community/reports',
                excludeUserId: $userId,
            );

            return $this->successResponse(true, $this->transformPost($report), 'Đã ẩn bài viết và đánh dấu tất cả báo cáo là đã xử lý.');
        }

        $report = BlogReport::with('blog')->findOrFail($id);
        if (! $report->blog) {
            return $this->errorResponse(false, 'Blog không tồn tại.', 404);
        }

        // Collect all unique reporters BEFORE bulk update
        $reporterIds = BlogReport::where('blog_id', $report->blog_id)
            ->pluck('reporter_id')->unique();
        $reporters = User::whereIn('id', $reporterIds)->get();

        $report->blog->update(['status' => 'hidden']);

        // Bulk-resolve every report for this blog
        BlogReport::where('blog_id', $report->blog_id)
            ->update(['status' => 'resolved', 'resolved_by' => $userId, 'resolved_at' => $now]);

        $report->refresh()->load(['blog:id,slug,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        $contentTitle = $report->blog?->title ?? 'Blog đã xóa';
        $admin        = $request->user();

        // Notify all reporters (user-facing, real-time WebSocket)
        foreach ($reporters as $reporter) {
            UserNotificationService::dispatchReportResolved($reporter, $admin, 'blog', $contentTitle);
        }

        // Notify other admins
        NotificationService::dispatch(
            title: 'Nội dung vi phạm đã bị ẩn',
            message: "{$admin->full_name} đã ẩn blog \"{$contentTitle}\" và đánh dấu tất cả báo cáo liên quan là Đã xử lý.",
            action: 'status_changed',
            entityType: 'blog_report',
            entityId: $report->id,
            performedBy: $admin->full_name,
            link: '/community/reports',
            excludeUserId: $userId,
        );

        return $this->successResponse(true, $this->transformBlog($report), 'Đã ẩn blog và đánh dấu tất cả báo cáo là đã xử lý.');
    }

    public function dismiss(Request $request, string $type, int $id): JsonResponse
    {
        $now    = now();
        $userId = $request->user()->id;

        if ($type === 'post') {
            $report = PostReport::findOrFail($id);

            // Other pending/reviewing reports for same post → superseded
            PostReport::where('post_id', $report->post_id)
                ->where('id', '!=', $id)
                ->whereIn('status', ['pending', 'reviewing'])
                ->update(['status' => 'superseded', 'resolved_by' => $userId, 'resolved_at' => $now]);

            // This report → dismissed
            $report->update(['status' => 'dismissed', 'resolved_by' => $userId, 'resolved_at' => $now]);
            $report->load(['post:id,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

            $contentTitle = $report->post?->title ?? 'Bài viết đã xóa';
            $contentLink  = $report->post ? "/cong-dong/bai-viet/{$report->post->id}" : '';
            $admin        = $request->user();

            // Notify the reporter (user-facing, real-time WebSocket)
            if ($report->reporter) {
                UserNotificationService::dispatchReportDismissed(
                    $report->reporter, $admin, 'post', $contentTitle, $contentLink
                );
            }

            // Notify other admins
            NotificationService::dispatch(
                title: 'Báo cáo vi phạm đã được bỏ qua',
                message: "{$admin->full_name} đã bỏ qua báo cáo về bài viết \"{$contentTitle}\".",
                action: 'status_changed',
                entityType: 'post_report',
                entityId: $report->id,
                performedBy: $admin->full_name,
                link: '/community/reports',
                excludeUserId: $userId,
            );

            return $this->successResponse(true, $this->transformPost($report), 'Đã bỏ qua báo cáo.');
        }

        $report = BlogReport::findOrFail($id);

        // Other pending/reviewing reports for same blog → superseded
        BlogReport::where('blog_id', $report->blog_id)
            ->where('id', '!=', $id)
            ->whereIn('status', ['pending', 'reviewing'])
            ->update(['status' => 'superseded', 'resolved_by' => $userId, 'resolved_at' => $now]);

        // This report → dismissed
        $report->update(['status' => 'dismissed', 'resolved_by' => $userId, 'resolved_at' => $now]);
        $report->load(['blog:id,slug,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        $contentTitle = $report->blog?->title ?? 'Blog đã xóa';
        $contentLink  = $report->blog?->slug ? "/blog/{$report->blog->slug}" : '';
        $admin        = $request->user();

        // Notify the reporter (user-facing, real-time WebSocket)
        if ($report->reporter) {
            UserNotificationService::dispatchReportDismissed(
                $report->reporter, $admin, 'blog', $contentTitle, $contentLink
            );
        }

        // Notify other admins
        NotificationService::dispatch(
            title: 'Báo cáo vi phạm đã được bỏ qua',
            message: "{$admin->full_name} đã bỏ qua báo cáo về blog \"{$contentTitle}\".",
            action: 'status_changed',
            entityType: 'blog_report',
            entityId: $report->id,
            performedBy: $admin->full_name,
            link: '/community/reports',
            excludeUserId: $userId,
        );

        return $this->successResponse(true, $this->transformBlog($report), 'Đã bỏ qua báo cáo.');
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function transformPost(PostReport $report): array
    {
        return [
            'id'          => $report->id,
            'type'        => 'post',
            'content'     => $report->post ? [
                'id'     => $report->post->id,
                'slug'   => null,
                'title'  => $report->post->title,
                'status' => $report->post->status,
            ] : null,
            'reporter'    => $report->reporter ? [
                'id'        => $report->reporter->id,
                'full_name' => $report->reporter->full_name,
                'email'     => $report->reporter->email,
                'username'  => $report->reporter->username,
            ] : null,
            'resolver'    => $report->resolver ? [
                'id'        => $report->resolver->id,
                'full_name' => $report->resolver->full_name,
            ] : null,
            'reason'      => $report->reason,
            'description' => $report->description,
            'status'      => $report->status,
            'resolved_at' => $report->resolved_at?->toIso8601String(),
            'created_at'  => $report->created_at->toIso8601String(),
        ];
    }

    private function transformBlog(BlogReport $report): array
    {
        return [
            'id'          => $report->id,
            'type'        => 'blog',
            'content'     => $report->blog ? [
                'id'     => $report->blog->id,
                'slug'   => $report->blog->slug,
                'title'  => $report->blog->title,
                'status' => $report->blog->status,
            ] : null,
            'reporter'    => $report->reporter ? [
                'id'        => $report->reporter->id,
                'full_name' => $report->reporter->full_name,
                'email'     => $report->reporter->email,
                'username'  => $report->reporter->username,
            ] : null,
            'resolver'    => $report->resolver ? [
                'id'        => $report->resolver->id,
                'full_name' => $report->resolver->full_name,
            ] : null,
            'reason'      => $report->reason,
            'description' => $report->description,
            'status'      => $report->status,
            'resolved_at' => $report->resolved_at?->toIso8601String(),
            'created_at'  => $report->created_at->toIso8601String(),
        ];
    }
}
