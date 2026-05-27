<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'blogs_count', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');

        $tags = Tag::query()
            ->withCount('blogs')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
            ))
            ->orderBy($sort === 'blogs_count' ? 'blogs_count' : $sort, $order)
            ->paginate($perPage);

        $tags->getCollection()->transform(fn (Tag $tag) => $this->transformTag($tag));

        return $this->paginatedResponse($tags, ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255|unique:tags,slug',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
        ]);

        $name = trim($request->string('name')->value());
        $tag  = Tag::create([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'color'       => $request->filled('color') ? trim($request->string('color')->value()) : null,
            'created_by'  => $request->user()?->id,
            'updated_by'  => $request->user()?->id,
        ]);

        $tag->loadCount('blogs');

        return $this->createdResponse($this->transformTag($tag), 'Tạo tag thành công.');
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => "nullable|string|max:255|unique:tags,slug,{$tag->id}",
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
        ]);

        $name = trim($request->string('name')->value());
        $tag->update([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'color'       => $request->filled('color') ? trim($request->string('color')->value()) : $tag->color,
            'updated_by'  => $request->user()?->id,
        ]);

        $tag->loadCount('blogs');

        return $this->successResponse(true, $this->transformTag($tag), 'Cập nhật tag thành công.');
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return $this->successResponse(true, null, 'Xóa tag thành công.');
    }

    private function transformTag(Tag $tag): array
    {
        return [
            'id'          => $tag->id,
            'name'        => $tag->name,
            'slug'        => $tag->slug,
            'color'       => $tag->color,
            'posts_count' => 0,
            'blogs_count' => $tag->blogs_count ?? 0,
            'created_at'  => $tag->created_at?->toIso8601String(),
        ];
    }
}
