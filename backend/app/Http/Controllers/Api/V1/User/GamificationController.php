<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Level;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GamificationController extends BaseApiController
{
    /**
     * Thông tin gamification của user hiện tại: điểm, cấp độ, tiến độ, thứ hạng.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('level');
        $totalPoints = (int) $user->total_points;

        $nextLevel = Level::query()
            ->where('min_points', '>', $totalPoints)
            ->orderBy('min_points')
            ->first();

        $currentMin = $user->level?->min_points ?? 0;
        $progress = null;
        if ($nextLevel) {
            $span = $nextLevel->min_points - $currentMin;
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
            'level' => $this->formatLevel($user->level),
            'next_level' => $this->formatLevel($nextLevel),
            'points_to_next_level' => $nextLevel ? max(0, $nextLevel->min_points - $totalPoints) : null,
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
        $levels = Level::query()->get()->keyBy('id');

        $rows = PointTransaction::query()
            ->join('users', 'users.id', '=', 'point_transactions.user_id')
            ->where('point_transactions.created_at', '>=', $weekStart)
            ->groupBy('users.id', 'users.full_name', 'users.username', 'users.email', 'users.avatar', 'users.level_id')
            ->orderByDesc(DB::raw('SUM(point_transactions.points)'))
            ->limit(50)
            ->get([
                'users.id',
                'users.full_name',
                'users.username',
                'users.email',
                'users.avatar',
                'users.level_id',
                DB::raw('SUM(point_transactions.points) as points'),
            ]);

        $currentUserId = $request->user()->id;
        $entries = $rows->values()->map(fn ($row, int $i) => [
            'rank' => $i + 1,
            'user_id' => $row->id,
            'full_name' => $row->full_name,
            'username' => $row->username,
            'email' => $row->email,
            'avatar' => $this->avatarUrl($row->avatar),
            'points' => (int) $row->points,
            'level' => $this->formatLevelOrDefault($levels->get($row->level_id)),
            'is_me' => $row->id === $currentUserId,
        ])->all();

        return $this->successResponse(true, $entries, 'Lấy bảng xếp hạng tuần thành công.');
    }

    /**
     * Bảng xếp hạng mọi thời điểm — theo users.total_points.
     */
    public function allTimeLeaderboard(Request $request): JsonResponse
    {
        $rows = User::query()
            ->with('level:id,name,badge,min_points')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit(50)
            ->get(['id', 'full_name', 'username', 'email', 'avatar', 'total_points', 'level_id']);

        $entries = $rows->values()->map(fn (User $u, int $i) => [
            'rank' => $i + 1,
            'user_id' => $u->id,
            'full_name' => $u->full_name,
            'username' => $u->username,
            'email' => $u->email,
            'avatar' => $this->avatarUrl($u->avatar),
            'points' => (int) $u->total_points,
            'level' => $this->formatLevelOrDefault($u->level),
            'is_me' => $u->id === $request->user()->id,
        ]);

        return $this->successResponse(true, $entries, 'Lấy bảng xếp hạng tổng thành công.');
    }

    private ?Level $defaultLevel = null;

    private bool $defaultLevelLoaded = false;

    /**
     * Cấp độ thấp nhất (mặc định, vd Đồng) — dùng khi user chưa có cấp độ.
     */
    private function defaultLevel(): ?Level
    {
        if (! $this->defaultLevelLoaded) {
            $this->defaultLevel = Level::query()->orderBy('min_points')->first();
            $this->defaultLevelLoaded = true;
        }

        return $this->defaultLevel;
    }

    private function formatLevel(?Level $level): ?array
    {
        if (! $level) {
            return null;
        }

        return [
            'id' => $level->id,
            'name' => $level->name,
            'badge' => $this->badgeUrl($level->badge),
            'min_points' => $level->min_points,
        ];
    }

    /**
     * Như formatLevel nhưng rơi về cấp độ mặc định (Đồng) nếu user chưa có cấp độ.
     * Dùng cho bảng xếp hạng để luôn có badge hiển thị.
     */
    private function formatLevelOrDefault(?Level $level): ?array
    {
        return $this->formatLevel($level ?? $this->defaultLevel());
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
