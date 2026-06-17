<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\PointRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Quản lý luật điểm (point_rules).
 *
 * Lưu ý nghiệp vụ: KHÔNG có endpoint cộng/trừ điểm thủ công.
 * Điểm chỉ được cộng tự động qua App\Services\PointService.
 */
class PointRuleController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'key', 'name', 'points', 'is_active', 'created_at'];
        $sort = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');
        $status = $request->query('status'); // 'active' | 'inactive' | null

        $rules = PointRule::query()
            ->withCount('transactions')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$search}%")
                ->orWhere('key', 'like', "%{$search}%")
            ))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy($sort, $order)
            ->paginate($perPage);

        return $this->paginatedResponse($rules, ApiMessage::RETRIEVED);
    }

    public function show(PointRule $pointRule): JsonResponse
    {
        $pointRule->loadCount('transactions');

        return $this->successResponse(true, $pointRule, ApiMessage::RETRIEVED);
    }

    public function update(Request $request, PointRule $pointRule): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'points' => 'required|integer',
            'max_per_day' => 'nullable|integer|min:1',
            'max_per_week' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $pointRule->update($data);

        return $this->successResponse(true, $pointRule->fresh(), 'Cập nhật luật điểm thành công.');
    }
}
