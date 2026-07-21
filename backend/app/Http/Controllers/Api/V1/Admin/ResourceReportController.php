<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ResourceReport;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceReportController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $status = $request->query('status');
        $search = $request->query('search');

        $allowedSorts = ['id', 'resource_title', 'reporter_name', 'reason', 'description', 'status', 'created_at'];
        $sort = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';

        $query = ResourceReport::with([
            'resource:id,title,url,status',
            'reporter:id,full_name,email,username',
            'resolver:id,full_name',
        ]);

        match ($sort) {
            'resource_title' => $query->orderByRaw("(SELECT title FROM resources WHERE resources.id = resource_reports.resource_id) {$order}"),
            'reporter_name'  => $query->orderByRaw("(SELECT full_name FROM users WHERE users.id = resource_reports.reporter_id) {$order}"),
            default          => $query->orderBy("resource_reports.{$sort}", $order),
        };

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('reporter', fn ($q) => $q
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            );
        }

        $paginated = $query->paginate($perPage);
        $items = collect($paginated->items())->map(fn (ResourceReport $r) => $this->transform($r));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách báo cáo tài nguyên thành công.',
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'from' => $paginated->firstItem(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'to' => $paginated->lastItem(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        return $this->successResponse(true, [
            'total' => ResourceReport::count(),
            'pending' => ResourceReport::where('status', 'pending')->count(),
            'dismissed' => ResourceReport::where('status', 'dismissed')->count(),
            'resolved_hidden' => ResourceReport::where('status', 'resolved_hidden')->count(),
        ], 'Lấy thống kê thành công.');
    }

    public function dismiss(Request $request, ResourceReport $report): JsonResponse
    {
        $admin = $request->user();

        $report->update([
            'status' => 'dismissed',
            'resolved_by' => $admin->id,
            'resolved_at' => now(),
        ]);

        $report->load(['resource:id,title,url,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);

        if ($report->reporter) {
            UserNotificationService::dispatchResourceReportDismissed($report->reporter, $admin, $report->resource?->title ?? 'Tài nguyên đã xóa');
        }

        return $this->successResponse(true, $this->transform($report), 'Đã bỏ báo cáo.');
    }

    public function hide(Request $request, ResourceReport $report): JsonResponse
    {
        $request->validate([
            'resolution_note' => ['required', 'string', 'max:1000'],
        ]);

        $resource = $report->resource;

        if (! $resource) {
            return $this->errorResponse(false, 'Tài nguyên không tồn tại.', 404);
        }

        $admin = $request->user();
        $reason = $request->input('resolution_note');

        $resource->update(['status' => 'hidden']);
        $report->update([
            'status' => 'resolved_hidden',
            'resolution_note' => $reason,
            'resolved_by' => $admin->id,
            'resolved_at' => now(),
        ]);

        $report->load(['resource:id,title,url,status', 'reporter:id,full_name,email,username', 'resolver:id,full_name']);
        $resource->load('uploader');

        if ($resource->uploader) {
            UserNotificationService::dispatchResourceHidden($resource->uploader, $admin, $resource, $reason);
        }

        return $this->successResponse(true, $this->transform($report), 'Đã ẩn tài nguyên và gửi thông báo cho người đăng.');
    }

    private function transform(ResourceReport $report): array
    {
        return [
            'id' => $report->id,
            'resource' => $report->resource ? [
                'id' => $report->resource->id,
                'title' => $report->resource->title,
                'url' => $report->resource->url,
                'status' => $report->resource->status,
            ] : null,
            'reporter' => $report->reporter ? [
                'id' => $report->reporter->id,
                'full_name' => $report->reporter->full_name,
                'email' => $report->reporter->email,
                'username' => $report->reporter->username,
            ] : null,
            'resolver' => $report->resolver ? [
                'id' => $report->resolver->id,
                'full_name' => $report->resolver->full_name,
            ] : null,
            'reason' => $report->reason,
            'description' => $report->description,
            'status' => $report->status,
            'resolution_note' => $report->resolution_note,
            'resolved_at' => $report->resolved_at?->toIso8601String(),
            'created_at' => $report->created_at->toIso8601String(),
        ];
    }
}
