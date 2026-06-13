<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\PointTransaction;
use App\Models\Rank;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GamificationController extends BaseApiController
{
    /**
     * Thông tin gamification của user hiện tại: điểm, rank, tiến độ, thứ hạng.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('rank');
        $totalPoints = (int) $user->total_points;

        $nextRank = Rank::query()
            ->where('min_points', '>', $totalPoints)
            ->orderBy('min_points')
            ->first();

        $currentMin = $user->rank?->min_points ?? 0;
        $progress = null;
        if ($nextRank) {
            $span = $nextRank->min_points - $currentMin;
            $progress = $span > 0
                ? round((($totalPoints - $currentMin) / $span) * 100, 1)
                : 0.0;
        }

        // Thứ hạng all-time: số user có điểm cao hơn + 1.
        $allTimeRank = User::query()->where('total_points', '>', $totalPoints)->count() + 1;

        // Điểm tuần này của user + thứ hạng tuần.
        $weekStart = now()->startOfWeek();
        $myWeekPoints = (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $weekStart)
            ->sum('points');

        // Chỉ select cột group-by (user_id) để tương thích ONLY_FULL_GROUP_BY của MySQL/MariaDB.
        $weeklyRank = PointTransaction::query()
            ->select('user_id')
            ->where('created_at', '>=', $weekStart)
            ->groupBy('user_id')
            ->havingRaw('SUM(points) > ?', [$myWeekPoints])
            ->get()
            ->count() + 1;

        return $this->successResponse(true, [
            'total_points' => $totalPoints,
            'current_rank' => $this->formatRank($user->rank),
            'next_rank' => $this->formatRank($nextRank),
            'points_to_next_rank' => $nextRank ? max(0, $nextRank->min_points - $totalPoints) : null,
            'progress_percent' => $progress,
            'week_points' => $myWeekPoints,
            'rank_all_time' => $allTimeRank,
            'rank_weekly' => $weeklyRank,
        ], 'Lấy thông tin gamification thành công.');
    }

    /**
     * Lịch sử điểm của user hiện tại (mới nhất trước).
     */
    public function history(Request $request): JsonResponse
    {
        $transactions = PointTransaction::query()
            ->where('user_id', $request->user()->id)
            ->with('pointRule:id,key,name')
            ->orderByDesc('created_at')
            ->paginate((int) $request->query('per_page', 20));

        $transactions->getCollection()->transform(fn (PointTransaction $tx) => [
            'id' => $tx->id,
            'points' => $tx->points,
            'rule' => $tx->pointRule?->name,
            'rule_key' => $tx->pointRule?->key,
            'source_type' => $tx->source_type,
            'source_id' => $tx->source_id,
            'created_at' => $tx->created_at?->toIso8601String(),
        ]);

        return $this->paginatedResponse($transactions, 'Lấy lịch sử điểm thành công.');
    }

    /**
     * Bảng xếp hạng tuần — tổng điểm trong tuần hiện tại từ point_transactions.
     */
    public function weeklyLeaderboard(Request $request): JsonResponse
    {
        $weekStart = now()->startOfWeek();
        $ranks = Rank::query()->get()->keyBy('id');
        $perPage = $this->leaderboardPerPage($request);

        $rows = PointTransaction::query()
            ->join('users', 'users.id', '=', 'point_transactions.user_id')
            ->where('point_transactions.created_at', '>=', $weekStart)
            ->groupBy('users.id', 'users.full_name', 'users.username', 'users.email', 'users.avatar', 'users.rank_id')
            ->orderByDesc(DB::raw('SUM(point_transactions.points)'))
            ->orderBy('users.id')
            ->select([
                'users.id',
                'users.full_name',
                'users.username',
                'users.email',
                'users.avatar',
                'users.rank_id',
                DB::raw('SUM(point_transactions.points) as points'),
            ])
            ->paginate($perPage);

        $currentUserId = auth('sanctum')->id();
        $rankOffset = ($rows->currentPage() - 1) * $rows->perPage();

        $rows->getCollection()->transform(fn ($row, int $i) => [
            'rank' => $rankOffset + $i + 1,
            'user_id' => $row->id,
            'full_name' => $row->full_name,
            'username' => $row->username,
            'email' => $row->email,
            'avatar' => $this->avatarUrl($row->avatar),
            'points' => (int) $row->points,
            'member_rank' => $this->formatRankOrDefault($ranks->get($row->rank_id)),
            'is_me' => $currentUserId !== null && (int) $row->id === (int) $currentUserId,
        ]);

        return $this->paginatedResponse($rows, 'Lấy bảng xếp hạng tuần thành công.');
    }

    /**
     * Bảng xếp hạng mọi thời điểm — theo users.total_points.
     */
    public function allTimeLeaderboard(Request $request): JsonResponse
    {
        $currentUserId = auth('sanctum')->id();
        $perPage = $this->leaderboardPerPage($request);

        $rows = User::query()
            ->with('rank:id,name,badge,min_points')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->paginate($perPage, ['id', 'full_name', 'username', 'email', 'avatar', 'total_points', 'rank_id']);

        $rankOffset = ($rows->currentPage() - 1) * $rows->perPage();

        $rows->getCollection()->transform(fn (User $u, int $i) => [
            'rank' => $rankOffset + $i + 1,
            'user_id' => $u->id,
            'full_name' => $u->full_name,
            'username' => $u->username,
            'email' => $u->email,
            'avatar' => $this->avatarUrl($u->avatar),
            'points' => (int) $u->total_points,
            'member_rank' => $this->formatRankOrDefault($u->rank),
            'is_me' => $currentUserId !== null && (int) $u->id === (int) $currentUserId,
        ]);

        return $this->paginatedResponse($rows, 'Lấy bảng xếp hạng tổng thành công.');
    }

    private function leaderboardPerPage(Request $request): int
    {
        return min(100, max(1, (int) $request->query('per_page', 20)));
    }

    private ?Rank $defaultRank = null;

    private bool $defaultRankLoaded = false;

    /**
     * Rank thấp nhất (mặc định, vd Đồng) — dùng khi user chưa có rank.
     */
    private function defaultRank(): ?Rank
    {
        if (! $this->defaultRankLoaded) {
            $this->defaultRank = Rank::query()->orderBy('min_points')->first();
            $this->defaultRankLoaded = true;
        }

        return $this->defaultRank;
    }

    private function formatRank(?Rank $rank): ?array
    {
        if (! $rank) {
            return null;
        }

        return [
            'id' => $rank->id,
            'name' => $rank->name,
            'badge' => $this->badgeUrl($rank->badge),
            'min_points' => $rank->min_points,
        ];
    }

    /**
     * Như formatRank nhưng rơi về rank mặc định (Đồng) nếu user chưa có rank.
     * Dùng cho bảng xếp hạng để luôn có badge hiển thị.
     */
    private function formatRankOrDefault(?Rank $rank): ?array
    {
        return $this->formatRank($rank ?? $this->defaultRank());
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

    private function avatarUrl(?string $avatar): ?string
    {
        if (! $avatar) {
            return null;
        }

        if (str_starts_with($avatar, 'http')) {
            return $avatar;
        }

        return Storage::disk('public')->url($avatar);
    }
}
