<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\PostReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $status  = $request->query('status');
        $search  = $request->query('search');

        $allowedSorts = ['id', 'post_title', 'reporter_name', 'reason', 'description', 'status', 'created_at'];
        $sort  = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';

        $query = PostReport::with([
            'post:id,title,status',
            'reporter:id,full_name,email,username',
            'resolver:id,full_name',
        ]);

        match ($sort) {
            'post_title'    => $query->orderByRaw("(SELECT title FROM posts WHERE posts.id = post_reports.post_id) {$order}"),
            'reporter_name' => $query->orderByRaw("(SELECT full_name FROM users WHERE users.id = post_reports.reporter_id) {$order}"),
            default         => $query->orderBy("post_reports.{$sort}", $order),
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
        $items     = collect($paginated->items())->map(fn (PostReport $r) => $this->transform($r));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách báo cáo thành công.',
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
            'total'     => PostReport::count(),
            'pending'   => PostReport::where('status', 'pending')->count(),
            'reviewing' => PostReport::where('status', 'reviewing')->count(),
            'resolved'  => PostReport::where('status', 'resolved')->count(),
            'dismissed' => PostReport::where('status', 'dismissed')->count(),
        ], 'Lấy thống kê thành công.');
    }

    public function updateStatus(Request $request, PostReport $report): JsonResponse
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
        $report->load(['post:id,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        return $this->successResponse(true, $this->transform($report), 'Cập nhật trạng thái thành công.');
    }

    public function hidePost(Request $request, PostReport $report): JsonResponse
    {
        $post = $report->post;

        if (! $post) {
            return $this->errorResponse(false, 'Bài viết không tồn tại.', 404);
        }

        $post->update(['status' => 'hidden']);
        $report->update([
            'status'      => 'resolved',
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        $report->load(['post:id,title,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        return $this->successResponse(true, $this->transform($report), 'Đã ẩn bài viết và đánh dấu đã xử lý.');
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function transform(PostReport $report): array
    {
        return [
            'id'          => $report->id,
            'post'        => $report->post ? [
                'id'     => $report->post->id,
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
}
