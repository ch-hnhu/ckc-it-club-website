<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Channel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChannelController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'slug', 'description', 'posts_count', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');

        $channels = Channel::query()
            ->withCount('posts')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
            ))
            ->orderBy($sort, $order)
            ->paginate($perPage);

        $channels->getCollection()->transform(fn (Channel $c) => $this->transformChannel($c));

        return $this->paginatedResponse($channels, ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255|unique:channels,slug',
            'description' => 'nullable|string',
        ]);

        $name    = trim($request->string('name')->value());
        $channel = Channel::create([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'created_by'  => $request->user()?->id,
            'updated_by'  => $request->user()?->id,
        ]);

        $channel->loadCount('posts');

        return $this->createdResponse($this->transformChannel($channel), 'Tạo kênh thành công.');
    }

    public function update(Request $request, Channel $channel): JsonResponse
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => "nullable|string|max:255|unique:channels,slug,{$channel->id}",
            'description' => 'nullable|string',
        ]);

        $name = trim($request->string('name')->value());
        $channel->update([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'updated_by'  => $request->user()?->id,
        ]);

        $channel->loadCount('posts');

        return $this->successResponse(true, $this->transformChannel($channel), 'Cập nhật kênh thành công.');
    }

    public function destroy(Channel $channel): JsonResponse
    {
        $channel->delete();

        return $this->successResponse(true, null, 'Xóa kênh thành công.');
    }

    private function transformChannel(Channel $channel): array
    {
        return [
            'id'          => $channel->id,
            'name'        => $channel->name,
            'slug'        => $channel->slug,
            'description' => $channel->description,
            'posts_count' => $channel->posts_count ?? 0,
            'created_at'  => $channel->created_at?->toIso8601String(),
            'updated_at'  => $channel->updated_at?->toIso8601String(),
        ];
    }
}
