<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Resource;
use App\Services\NotificationService;
use App\Services\ResourceAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResourceController extends BaseApiController
{
    public function __construct(private readonly ResourceAccessService $access)
    {
        parent::__construct();
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->access->assertCanBrowse($user);

        $perPage = min((int) $request->query('per_page', 12), 50);
        $search = $request->query('search');
        $linkType = $request->query('link_type');

        $resources = Resource::query()
            ->with('uploader:id,full_name,email,avatar,username')
            ->where('status', 'published')
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->when($linkType && $linkType !== 'all', fn ($q) => $q->where('link_type', $linkType))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $unlockedIds = $this->access->unlockedIds($user);

        $resources->getCollection()->transform(
            fn (Resource $resource) => $this->transform($resource, $this->isUnlocked($resource, $user->id, $unlockedIds))
        );

        return $this->paginatedResponse($resources, ApiMessage::RETRIEVED);
    }

    public function show(Request $request, Resource $resource): JsonResponse
    {
        if ($resource->status !== 'published') {
            abort(404);
        }

        $this->access->assertCanOpen($request->user(), $resource);

        $resource->load('uploader:id,full_name,email,avatar,username');

        return $this->successResponse(true, $this->transform($resource, true), ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $this->access->assertCanBrowse($request->user());

        $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:2000'],
            'link_type' => ['required', Rule::in(['google_drive', 'youtube', 'github', 'document', 'other'])],
            'url' => ['required', 'url', 'max:2000'],
        ]);

        $resource = Resource::create([
            'uploader_id' => $request->user()->id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'link_type' => $request->input('link_type'),
            'url' => $request->input('url'),
            'status' => 'pending_review',
        ]);

        $resource->load('uploader:id,full_name,email,avatar,username');

        $uploader = $request->user();
        NotificationService::dispatch(
            title: 'Tài nguyên mới cần duyệt',
            message: "{$uploader->full_name} đã gửi tài nguyên \"{$resource->title}\" chờ duyệt.",
            action: 'created',
            entityType: 'resource',
            entityId: $resource->id,
            performedBy: $uploader->full_name,
            link: '/tai-nguyen/quan-ly',
        );

        return $this->createdResponse($this->transform($resource, true), 'Tài nguyên đã được gửi và đang chờ duyệt.');
    }

    public function myResources(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 50);

        $resources = Resource::with('uploader:id,full_name,email,avatar,username')
            ->where('uploader_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Tài nguyên của chính mình luôn mở khoá, kể cả bản chưa duyệt.
        $resources->getCollection()->transform(fn (Resource $resource) => $this->transform($resource, true));

        return $this->paginatedResponse($resources, ApiMessage::RETRIEVED);
    }

    public function recordClick(Request $request, Resource $resource): JsonResponse
    {
        $this->access->assertCanOpen($request->user(), $resource);

        $resource->increment('click_count');

        return $this->successResponse(true, ['click_count' => $resource->click_count], 'Đã ghi nhận lượt mở.');
    }

    public function report(Request $request, int $id): JsonResponse
    {
        $this->access->assertCanBrowse($request->user());

        $resource = Resource::query()->where('status', 'published')->findOrFail($id);

        if ($resource->uploader_id === $request->user()->id) {
            abort(403, 'Bạn không thể báo cáo tài nguyên của chính mình.');
        }

        $validated = $request->validate([
            'reason' => ['required', Rule::in(['inappropriate', 'broken_link', 'copyright', 'other'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $alreadyReported = $resource->reports()->where('reporter_id', $request->user()->id)->exists();

        if (! $alreadyReported) {
            $resource->reports()->create([
                'reporter_id' => $request->user()->id,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            $reporter = $request->user();
            NotificationService::dispatch(
                title: 'Báo cáo vi phạm mới',
                message: "{$reporter->full_name} đã báo cáo tài nguyên \"{$resource->title}\".",
                action: 'created',
                entityType: 'resource_report',
                entityId: $resource->id,
                performedBy: $reporter->full_name,
                link: '/tai-nguyen/bao-cao',
            );
        }

        return $this->successResponse(true, [], 'Báo cáo đã được ghi nhận.');
    }

    /**
     * @param  list<int>|null  $unlockedIds  null = user xem được tất cả
     */
    private function isUnlocked(Resource $resource, int|string $userId, ?array $unlockedIds): bool
    {
        return $unlockedIds === null
            || (int) $resource->uploader_id === (int) $userId
            || in_array((int) $resource->id, $unlockedIds, true);
    }

    private function transform(Resource $resource, bool $unlocked): array
    {
        $uploader = $resource->uploader;

        return [
            'id' => $resource->id,
            'uploader' => $uploader ? [
                'id' => $uploader->id,
                'full_name' => $uploader->full_name,
                'avatar' => $uploader->avatar,
                'username' => $uploader->username,
            ] : null,
            'title' => $resource->title,
            'description' => $resource->description,
            'link_type' => $resource->link_type,
            // Không trả url cho tài nguyên bị khoá — nếu chỉ ẩn ở giao diện thì
            // vẫn lấy được link qua DevTools.
            'url' => $unlocked ? $resource->url : null,
            'is_locked' => ! $unlocked,
            'status' => $resource->status,
            'click_count' => (int) $resource->click_count,
            'created_at' => $resource->created_at?->toIso8601String(),
        ];
    }
}
