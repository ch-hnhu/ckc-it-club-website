<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\TagModelType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class TagController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'slug', 'blogs_count', 'created_at'];
        $sort      = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order     = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage   = (int) $request->query('per_page', 10);
        $search    = $request->query('search');
        $modelType = in_array($request->query('model_type'), TagModelType::values()) ? $request->query('model_type') : TagModelType::BLOG->value;

        $tags = Tag::query()
            ->ofType($modelType)
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
        $modelType = $request->filled('model_type') ? $request->string('model_type')->value() : TagModelType::BLOG->value;

        $request->validate([
            'model_type'  => ['nullable', Rule::in(TagModelType::values())],
            'name'        => ['required', 'string', 'max:255', Rule::unique('tags', 'name')->where('model_type', $modelType)],
            'slug'        => ['nullable', 'string', 'max:255', Rule::unique('tags', 'slug')->where('model_type', $modelType)],
            'description' => 'nullable|string',
        ], [
            'name.unique' => 'Tag này đã tồn tại.',
            'slug.unique' => 'Slug này đã được sử dụng.',
        ]);

        $name = trim($request->string('name')->value());
        $tag  = Tag::create([
            'model_type'  => $modelType,
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'created_by'  => $request->user()?->id,
            'updated_by'  => $request->user()?->id,
        ]);

        $tag->loadCount('blogs');

        return $this->createdResponse($this->transformTag($tag), 'Tạo tag thành công.');
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255', Rule::unique('tags', 'name')->where('model_type', $tag->model_type)->ignore($tag->id)],
            'slug'        => ['nullable', 'string', 'max:255', Rule::unique('tags', 'slug')->where('model_type', $tag->model_type)->ignore($tag->id)],
            'description' => 'nullable|string',
        ], [
            'name.unique' => 'Tag này đã tồn tại.',
            'slug.unique' => 'Slug này đã được sử dụng.',
        ]);

        $name = trim($request->string('name')->value());
        $tag->update([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
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
            'model_type'  => $tag->model_type,
            'name'        => $tag->name,
            'slug'        => $tag->slug,
            'posts_count' => 0,
            'blogs_count' => $tag->blogs_count ?? 0,
            'created_at'  => $tag->created_at?->toIso8601String(),
        ];
    }
}
