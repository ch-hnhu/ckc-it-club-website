<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SkillController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'sort_order', 'users_count', 'created_at'];
        $sort    = in_array($request->query('sort', 'sort_order'), $allowedSorts) ? $request->query('sort', 'sort_order') : 'sort_order';
        $order   = in_array($request->query('order', 'asc'), ['asc', 'desc']) ? $request->query('order', 'asc') : 'asc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $status  = $request->query('status'); // 'active' | 'inactive' | null

        $skills = Skill::query()
            ->withCount('users')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
            ))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy($sort === 'users_count' ? 'users_count' : $sort, $order)
            ->paginate($perPage);

        $skills->getCollection()->transform(fn (Skill $skill) => $this->transformSkill($skill));

        return $this->paginatedResponse($skills, ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255|unique:skills,name',
            'slug'       => 'nullable|string|max:255|unique:skills,slug',
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0|max:65535',
        ]);

        $name  = trim($request->string('name')->value());
        $skill = Skill::create([
            'name'       => $name,
            'slug'       => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'is_active'  => $request->boolean('is_active', true),
            'sort_order' => (int) $request->input('sort_order', 0),
        ]);

        $skill->loadCount('users');

        return $this->createdResponse($this->transformSkill($skill), 'Tạo skill thành công.');
    }

    public function update(Request $request, Skill $skill): JsonResponse
    {
        $request->validate([
            'name'       => "required|string|max:255|unique:skills,name,{$skill->id}",
            'slug'       => "nullable|string|max:255|unique:skills,slug,{$skill->id}",
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0|max:65535',
        ]);

        $name = trim($request->string('name')->value());
        $skill->update([
            'name'       => $name,
            'slug'       => $request->filled('slug') ? trim($request->string('slug')->value()) : Str::slug($name),
            'is_active'  => $request->boolean('is_active', $skill->is_active),
            'sort_order' => (int) $request->input('sort_order', $skill->sort_order),
        ]);

        $skill->loadCount('users');

        return $this->successResponse(true, $this->transformSkill($skill), 'Cập nhật skill thành công.');
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.id'         => 'required|integer|exists:skills,id',
            'items.*.sort_order' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->input('items') as $item) {
                Skill::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });

        return $this->successResponse(true, null, 'Đã cập nhật thứ tự skills.');
    }

    public function toggleStatus(Skill $skill): JsonResponse
    {
        $skill->update(['is_active' => !$skill->is_active]);
        $skill->loadCount('users');

        $msg = $skill->is_active ? 'Đã kích hoạt skill.' : 'Đã tắt skill.';

        return $this->successResponse(true, $this->transformSkill($skill), $msg);
    }

    public function destroy(Skill $skill): JsonResponse
    {
        $skill->delete();

        return $this->successResponse(true, null, 'Xóa skill thành công.');
    }

    private function transformSkill(Skill $skill): array
    {
        return [
            'id'          => $skill->id,
            'name'        => $skill->name,
            'slug'        => $skill->slug,
            'is_active'   => $skill->is_active,
            'sort_order'  => $skill->sort_order,
            'users_count' => $skill->users_count ?? 0,
            'created_at'  => $skill->created_at?->toIso8601String(),
        ];
    }
}
