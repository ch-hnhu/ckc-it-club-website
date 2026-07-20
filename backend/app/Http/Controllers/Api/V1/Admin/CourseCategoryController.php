<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\TagModelType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

/**
 * Quản lý danh mục khoá học (Trung tâm đào tạo).
 * Danh mục = tag thuộc model_type = course.
 */
class CourseCategoryController extends BaseApiController
{
    private const MODEL_TYPE = TagModelType::COURSE->value;

    #[OA\Get(
        path: '/v1/course-categories',
        summary: '[Admin] Danh sách danh mục khoá học (tag thuộc model_type=course)',
        description: 'Yêu cầu quyền courses.view.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'order', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công (phân trang)', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'slug', 'courses_count', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');

        $categories = Tag::query()
            ->ofType(self::MODEL_TYPE)
            ->withCount('courses')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
            ))
            ->orderBy($sort, $order)
            ->paginate($perPage);

        $categories->getCollection()->transform(fn (Tag $tag) => $this->transform($tag));

        return $this->paginatedResponse($categories, ApiMessage::RETRIEVED);
    }

    #[OA\Post(
        path: '/v1/course-categories',
        summary: '[Admin] Tạo danh mục khoá học mới',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['name'], properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 255),
                new OA\Property(property: 'slug', type: 'string', maxLength: 255, nullable: true),
                new OA\Property(property: 'description', type: 'string', nullable: true),
            ])
        ),
        responses: [
            new OA\Response(response: 201, description: 'Tạo thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Tên/slug đã tồn tại', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255', Rule::unique('tags', 'name')->where('model_type', self::MODEL_TYPE)],
            'slug'        => ['nullable', 'string', 'max:255', Rule::unique('tags', 'slug')->where('model_type', self::MODEL_TYPE)],
            'description' => 'nullable|string',
        ], [
            'name.unique' => 'Danh mục này đã tồn tại.',
            'slug.unique' => 'Slug này đã được sử dụng.',
        ]);

        $name = trim($request->string('name')->value());
        $tag  = Tag::create([
            'model_type'  => self::MODEL_TYPE,
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'created_by'  => $request->user()?->id,
            'updated_by'  => $request->user()?->id,
        ]);

        $tag->loadCount('courses');

        return $this->createdResponse($this->transform($tag), 'Tạo danh mục thành công.');
    }

    #[OA\Put(
        path: '/v1/course-categories/{tag}',
        summary: '[Admin] Cập nhật danh mục khoá học',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'tag', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['name'], properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 255),
                new OA\Property(property: 'slug', type: 'string', maxLength: 255, nullable: true),
                new OA\Property(property: 'description', type: 'string', nullable: true),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Cập nhật thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không phải danh mục khoá học', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Tên/slug đã tồn tại', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function update(Request $request, Tag $tag): JsonResponse
    {
        abort_unless($tag->model_type === self::MODEL_TYPE, 404);

        $request->validate([
            'name'        => ['required', 'string', 'max:255', Rule::unique('tags', 'name')->where('model_type', self::MODEL_TYPE)->ignore($tag->id)],
            'slug'        => ['nullable', 'string', 'max:255', Rule::unique('tags', 'slug')->where('model_type', self::MODEL_TYPE)->ignore($tag->id)],
            'description' => 'nullable|string',
        ], [
            'name.unique' => 'Danh mục này đã tồn tại.',
            'slug.unique' => 'Slug này đã được sử dụng.',
        ]);

        $name = trim($request->string('name')->value());
        $tag->update([
            'name'        => $name,
            'slug'        => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'updated_by'  => $request->user()?->id,
        ]);

        $tag->loadCount('courses');

        return $this->successResponse(true, $this->transform($tag), 'Cập nhật danh mục thành công.');
    }

    #[OA\Delete(
        path: '/v1/course-categories/{tag}',
        summary: '[Admin] Xoá danh mục khoá học',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'tag', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Xóa thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không phải danh mục khoá học', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function destroy(Tag $tag): JsonResponse
    {
        abort_unless($tag->model_type === self::MODEL_TYPE, 404);

        $tag->delete();

        return $this->successResponse(true, null, 'Xóa danh mục thành công.');
    }

    private function transform(Tag $tag): array
    {
        return [
            'id'            => $tag->id,
            'name'          => $tag->name,
            'slug'          => $tag->slug,
            'description'   => $tag->description,
            'courses_count' => $tag->courses_count ?? 0,
            'created_at'    => $tag->created_at?->toIso8601String(),
        ];
    }
}
