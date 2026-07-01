<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Resource;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResourceController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'title', 'status', 'link_type', 'click_count', 'created_at'];
        $sort = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = min((int) $request->query('per_page', 10), 50);
        $search = $request->query('search');
        $status = $request->query('status');

        $resources = Resource::query()
            ->with('uploader:id,full_name,email,avatar')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('title', 'like', "%{$search}%")
                ->orWhereHas('uploader', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderBy($sort, $order)
            ->paginate($perPage);

        $resources->getCollection()->transform(fn (Resource $resource) => $this->transform($resource));

        return $this->paginatedResponse($resources, ApiMessage::RETRIEVED);
    }

    public function show(Resource $resource): JsonResponse
    {
        $resource->load('uploader:id,full_name,email,avatar');

        return $this->successResponse(true, $this->transform($resource), ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $counts = DB::table('resources')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse(true, [
            'total' => $counts->sum(),
            'pending_review' => (int) ($counts['pending_review'] ?? 0),
            'published' => (int) ($counts['published'] ?? 0),
            'rejected' => (int) ($counts['rejected'] ?? 0),
            'hidden' => (int) ($counts['hidden'] ?? 0),
        ], ApiMessage::RETRIEVED);
    }

    public function updateStatus(Request $request, Resource $resource): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:published,rejected'],
            'notify' => ['nullable', 'boolean'],
        ]);

        $status = $request->string('status')->value();
        $notify = $request->boolean('notify', true);
        $admin = $request->user();

        $resource->update([
            'status' => $status,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        if ($notify) {
            $resource->load('uploader');

            if ($resource->uploader) {
                UserNotificationService::dispatchResourceReviewed($resource->uploader, $admin, $resource, $status);
            }
        }

        return $this->successResponse(true, ['status' => $resource->status], 'Cập nhật trạng thái tài nguyên thành công.');
    }

    public function destroy(Resource $resource): JsonResponse
    {
        $resource->delete();

        return $this->successResponse(true, null, 'Xóa tài nguyên thành công.');
    }

    private function transform(Resource $resource): array
    {
        $uploader = $resource->uploader;

        return [
            'id' => $resource->id,
            'uploader' => $uploader ? [
                'id' => $uploader->id,
                'full_name' => $uploader->full_name,
                'email' => $uploader->email,
                'avatar' => $uploader->avatar,
            ] : null,
            'title' => $resource->title,
            'description' => $resource->description,
            'link_type' => $resource->link_type,
            'url' => $resource->url,
            'status' => $resource->status,
            'click_count' => (int) $resource->click_count,
            'reviewed_at' => $resource->reviewed_at?->toIso8601String(),
            'created_at' => $resource->created_at?->toIso8601String(),
            'updated_at' => $resource->updated_at?->toIso8601String(),
        ];
    }
}
