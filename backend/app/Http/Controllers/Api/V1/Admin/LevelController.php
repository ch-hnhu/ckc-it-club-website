<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Level;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Quản lý luật cấp độ (levels).
 *
 * Sau khi sửa ngưỡng điểm, chạy `php artisan gamification:recompute-levels`
 * để đồng bộ level_id của toàn bộ user (không chạy trong request để tránh nặng).
 */
class LevelController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $levels = Level::query()
            ->withCount('users')
            ->orderBy('min_points')
            ->get()
            ->map(fn (Level $level) => $this->transformLevel($level));

        return $this->successResponse(true, $levels, ApiMessage::RETRIEVED);
    }

    public function show(Level $level): JsonResponse
    {
        $level->loadCount('users');

        return $this->successResponse(true, $this->transformLevel($level), ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        if ($request->hasFile('badge')) {
            $data['badge'] = $request->file('badge')->store('level-badges', 'public');
        }

        $level = Level::create($data);

        return $this->createdResponse($this->transformLevel($level), 'Tạo cấp độ thành công.');
    }

    public function update(Request $request, Level $level): JsonResponse
    {
        $data = $this->validateData($request, $level->id);

        if ($request->hasFile('badge')) {
            $this->deleteStoredBadge($level->badge);
            $data['badge'] = $request->file('badge')->store('level-badges', 'public');
        } else {
            unset($data['badge']);
        }

        $level->update($data);

        return $this->successResponse(true, $this->transformLevel($level->fresh()), 'Cập nhật cấp độ thành công.');
    }

    public function destroy(Level $level): JsonResponse
    {
        $this->deleteStoredBadge($level->badge);
        $level->delete();

        return $this->successResponse(true, null, 'Xóa cấp độ thành công.');
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $uniqueMin = 'required|integer|min:0|unique:levels,min_points'.($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'name' => 'required|string|max:255',
            'min_points' => $uniqueMin,
            'badge' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
        ]);
    }

    private function transformLevel(Level $level): array
    {
        return [
            'id' => $level->id,
            'name' => $level->name,
            'min_points' => $level->min_points,
            'badge' => $this->badgeUrl($level->badge),
            'users_count' => $level->users_count ?? null,
            'created_at' => $level->created_at,
            'updated_at' => $level->updated_at,
        ];
    }

    private function badgeUrl(?string $badge): ?string
    {
        if (! $badge) {
            return null;
        }

        if (Str::startsWith($badge, ['http://', 'https://', '/assets/'])) {
            return $badge;
        }

        return Storage::disk('public')->url($badge);
    }

    private function deleteStoredBadge(?string $badge): void
    {
        if (! $badge || Str::startsWith($badge, ['http://', 'https://', '/assets/', '/storage/'])) {
            return;
        }

        Storage::disk('public')->delete($badge);
    }
}
