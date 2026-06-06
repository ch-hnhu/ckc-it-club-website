<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\BlogReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogReportController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $status  = $request->query('status');
        $search  = $request->query('search');

        $allowedSorts = ['id', 'blog_title', 'reporter_name', 'reason', 'description', 'status', 'created_at'];
        $sort  = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';

        $query = BlogReport::with([
            'blog:id,slug,title,status',
            'reporter:id,full_name,email,username',
            'resolver:id,full_name',
        ]);

        match ($sort) {
            'blog_title'    => $query->orderByRaw("(SELECT title FROM blogs WHERE blogs.id = blog_reports.blog_id) {$order}"),
            'reporter_name' => $query->orderByRaw("(SELECT full_name FROM users WHERE users.id = blog_reports.reporter_id) {$order}"),
            default         => $query->orderBy("blog_reports.{$sort}", $order),
        };

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('reporter', fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('email',     'like', "%{$search}%")
            );
        }

        $paginated = $query->paginate($perPage);
        $items     = collect($paginated->items())->map(fn (BlogReport $r) => $this->transform($r));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách báo cáo blog thành công.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'from'         => $paginated->firstItem(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'to'           => $paginated->lastItem(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        return $this->successResponse(true, [
            'total'     => BlogReport::count(),
            'pending'   => BlogReport::where('status', 'pending')->count(),
            'reviewing' => BlogReport::where('status', 'reviewing')->count(),
            'resolved'  => BlogReport::where('status', 'resolved')->count(),
            'dismissed' => BlogReport::where('status', 'dismissed')->count(),
        ], 'Lấy thống kê thành công.');
    }

    public function updateStatus(Request $request, BlogReport $report): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,reviewing,resolved,dismissed'],
        ]);

        $status  = $request->input('status');
        $payload = ['status' => $status];

        if (in_array($status, ['resolved', 'dismissed'])) {
            $payload['resolved_by'] = $request->user()->id;
            $payload['resolved_at'] = now();
        }

        $report->update($payload);
        $report->load(['blog:id,slug,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        return $this->successResponse(true, $this->transform($report), 'Cập nhật trạng thái thành công.');
    }

    public function hideBlog(Request $request, BlogReport $report): JsonResponse
    {
        $blog = $report->blog;

        if (! $blog) {
            return $this->errorResponse(false, 'Blog không tồn tại.', 404);
        }

        $blog->update(['status' => 'hidden']);
        $report->update([
            'status'      => 'resolved',
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        $report->load(['blog:id,slug,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        return $this->successResponse(true, $this->transform($report), 'Đã ẩn blog và đánh dấu đã xử lý.');
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function transform(BlogReport $report): array
    {
        return [
            'id'          => $report->id,
            'blog'        => $report->blog ? [
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
