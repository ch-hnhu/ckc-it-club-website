<?php

namespace App\Services;

use App\Models\Rank;
use App\Models\PointRule;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Điểm trung tâm xử lý cộng điểm cho toàn hệ thống.
 *
 * Đây là NƠI DUY NHẤT được phép ghi users.total_points và users.rank_id.
 * Không controller hay class nào khác được cập nhật trực tiếp hai cột này.
 */
class PointService
{
    /**
     * Cộng điểm cho user theo một luật điểm (point_rule).
     *
     * Trả về PointTransaction nếu cộng thành công, hoặc null nếu bị bỏ qua vì:
     *  - luật không tồn tại / đang tắt
     *  - đã cộng điểm cho đúng source này rồi (chống trùng)
     *  - đã chạm giới hạn max_per_day / max_per_week
     *
     * @param  Model|null  $source  Đối tượng gốc (Blog|Post|Comment|Reaction) để chống trùng.
     */
    public static function award(
        User $user,
        string $ruleKey,
        ?Model $source = null,
        array $metadata = [],
    ): ?PointTransaction {
        $rule = PointRule::active()->where('key', $ruleKey)->first();

        if (! $rule) {
            return null;
        }

        $sourceType = $source ? self::sourceType($source) : null;
        $sourceId = $source?->getKey();

        return DB::transaction(function () use ($user, $rule, $sourceType, $sourceId, $metadata) {
            // Khóa hàng user để tránh race condition khi cộng điểm đồng thời.
            $lockedUser = User::whereKey($user->getKey())->lockForUpdate()->first();

            if (! $lockedUser) {
                return null;
            }

            // 1. Chống cộng điểm trùng cùng một source.
            if ($sourceType !== null && $sourceId !== null) {
                $duplicate = PointTransaction::query()
                    ->where('point_rule_id', $rule->id)
                    ->where('source_type', $sourceType)
                    ->where('source_id', $sourceId)
                    ->exists();

                if ($duplicate) {
                    return null;
                }
            }

            // 2. Giới hạn theo ngày.
            if ($rule->max_per_day !== null) {
                $countToday = PointTransaction::query()
                    ->where('user_id', $lockedUser->id)
                    ->where('point_rule_id', $rule->id)
                    ->where('created_at', '>=', now()->startOfDay())
                    ->count();

                if ($countToday >= $rule->max_per_day) {
                    return null;
                }
            }

            // 3. Giới hạn theo tuần.
            if ($rule->max_per_week !== null) {
                $countThisWeek = PointTransaction::query()
                    ->where('user_id', $lockedUser->id)
                    ->where('point_rule_id', $rule->id)
                    ->where('created_at', '>=', now()->startOfWeek())
                    ->count();

                if ($countThisWeek >= $rule->max_per_week) {
                    return null;
                }
            }

            // 4. Ghi lịch sử điểm.
            $transaction = PointTransaction::create([
                'user_id' => $lockedUser->id,
                'point_rule_id' => $rule->id,
                'points' => $rule->points,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'metadata' => $metadata !== [] ? $metadata : null,
            ]);

            // 5. Cập nhật tổng điểm và đồng bộ rank (gán trực tiếp, không mass-assign).
            $lockedUser->total_points += $rule->points;
            $lockedUser->rank_id = self::resolveRank($lockedUser->total_points)?->id;
            $lockedUser->save();

            return $transaction;
        });
    }

    /**
     * Tìm rank cao nhất mà user đạt được với số điểm cho trước.
     */
    private static function resolveRank(int $totalPoints): ?Rank
    {
        return Rank::query()
            ->where('min_points', '<=', $totalPoints)
            ->orderByDesc('min_points')
            ->first();
    }

    /**
     * Tên source rút gọn để lưu vào point_transactions (vd "blog", "post", "comment").
     */
    private static function sourceType(Model $source): string
    {
        return Str::snake(class_basename($source));
    }
}
