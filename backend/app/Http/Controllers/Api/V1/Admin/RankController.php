<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\RecomputeUserRanksJob;
use App\Models\Rank;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Str;

/**
 * Quản lý rank gamification.
 *
 * Sau khi rank thay đổi, backend tự enqueue job đồng bộ rank_id của toàn bộ user.
 */
class RankController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}
    public function index(Request $request): JsonResponse
    {
        $ranks = Rank::query()
            ->orderBy('min_points')
            ->get();

        $usersCountByRank = $this->countUsersByPointRanges($ranks);
        $ranks = $ranks->map(fn (Rank $rank) => $this->transformRank(
            $rank,
            $usersCountByRank[$rank->id] ?? 0,
        ));

        return $this->successResponse(true, $ranks, ApiMessage::RETRIEVED);
    }

    public function show(Rank $rank): JsonResponse
    {
        return $this->successResponse(true, $this->transformRank(
            $rank,
            $this->countUsersForRank($rank),
        ), ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        if ($request->hasFile('badge')) {
            $data['badge'] = $this->storage->uploadImage($request->file('badge'), 'rank');
        }

        $rank = Rank::create($data);
        $this->queueRankSync();

        return $this->createdResponse($this->transformRank($rank), 'Tạo rank thành công.');
    }

    public function update(Request $request, Rank $rank): JsonResponse
    {
        $data = $this->validateData($request, $rank->id);

        if ($request->hasFile('badge')) {
            $this->deleteStoredBadge($rank->badge);
            $data['badge'] = $this->storage->uploadImage($request->file('badge'), 'rank');
        } else {
            unset($data['badge']);
        }

        $rank->update($data);
        $this->queueRankSync();

        return $this->successResponse(true, $this->transformRank($rank->fresh()), 'Cập nhật rank thành công.');
    }

    public function destroy(Rank $rank): JsonResponse
    {
        $this->deleteStoredBadge($rank->badge);
        $rank->delete();
        $this->queueRankSync();

        return $this->successResponse(true, null, 'Xóa rank thành công.');
    }

    private function queueRankSync(): void
    {
        RecomputeUserRanksJob::dispatch()->afterCommit();
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $uniqueMin = 'required|integer|min:0|unique:ranks,min_points'.($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'name' => 'required|string|max:255',
            'min_points' => $uniqueMin,
            'badge' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
        ]);
    }

    private function transformRank(Rank $rank, ?int $usersCount = null): array
    {
        return [
            'id' => $rank->id,
            'name' => $rank->name,
            'min_points' => $rank->min_points,
            'badge' => $this->badgeUrl($rank->badge),
            'users_count' => $usersCount ?? $rank->users_count ?? 0,
            'created_at' => $rank->created_at,
            'updated_at' => $rank->updated_at,
        ];
    }

    /**
     * @param  Collection<int, Rank>  $ranks
     * @return array<int, int>
     */
    private function countUsersByPointRanges(Collection $ranks): array
    {
        $counts = [];
        $ranks = $ranks->values();

        foreach ($ranks as $index => $rank) {
            $counts[$rank->id] = $this->countUsersForRank($rank, $ranks->get($index + 1));
        }

        return $counts;
    }

    private function countUsersForRank(Rank $rank, ?Rank $nextRank = null): int
    {
        $nextRank ??= Rank::query()
            ->where('min_points', '>', $rank->min_points)
            ->orderBy('min_points')
            ->first();

        $query = User::query()->where('total_points', '>=', $rank->min_points);

        if ($nextRank) {
            $query->where('total_points', '<', $nextRank->min_points);
        }

        return $query->count();
    }

    private function badgeUrl(?string $badge): ?string
    {
        if (! $badge) {
            return null;
        }

        // After migration, badge is stored as a full public URL (Supabase or legacy http).
        // Passthrough: /assets/ paths are frontend-bundled badges.
        return $badge;
    }

    private function deleteStoredBadge(?string $badge): void
    {
        // Only attempt deletion for Supabase-hosted URLs.
        // Legacy /storage/ or /assets/ paths are skipped by the service automatically.
        if (! $badge) {
            return;
        }

        $this->storage->delete($badge);
    }
}
