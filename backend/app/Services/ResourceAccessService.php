<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\ResourceUnlock;
use App\Models\User;

/**
 * Quy tắc xem tài nguyên trong khu vực cộng đồng:
 *
 * - Thành viên CLB: mở được toàn bộ tài nguyên đã xuất bản.
 * - Sinh viên Cao Thắng: chỉ mở được FREE_LIMIT tài nguyên mới nhất *của người
 *   khác*, cộng với toàn bộ tài nguyên do chính mình đóng góp. Phần còn lại vẫn
 *   thấy tiêu đề/mô tả nhưng bị khoá liên kết.
 * - Còn lại (khách, tài khoản ngoài trường): không được xem danh sách.
 *
 * Suất miễn phí được GHIM CỨNG: lần đầu sinh viên vào kho, FREE_LIMIT tài nguyên
 * mới nhất (của người khác) được ghi vào bảng resource_unlocks và giữ nguyên về
 * sau. Tài nguyên mới được duyệt sẽ không đẩy tài nguyên đang mở về trạng thái
 * khoá nữa — trước đây tập này tính lại mỗi lần xem nên bị trượt theo thời gian.
 *
 * Tập ứng viên để cấp luôn lấy theo created_at desc trên TOÀN BỘ tài nguyên đã
 * xuất bản, cố ý không phụ thuộc vào bộ lọc/tìm kiếm/phân trang của request. Nếu
 * tính theo "3 mục đầu trang hiện tại" thì chỉ cần đổi bộ lọc là mở khoá được
 * lần lượt tất cả tài nguyên.
 */
class ResourceAccessService
{
    /** Số tài nguyên sinh viên Cao Thắng (chưa vào CLB) mở được. */
    public const FREE_LIMIT = 3;

    public function canBrowse(User $user): bool
    {
        return $user->isClubMember() || $user->isSchoolStudent();
    }

    public function assertCanBrowse(User $user): void
    {
        abort_if(
            ! $this->canBrowse($user),
            403,
            'Khu vực tài nguyên chỉ dành cho sinh viên trường Cao Thắng và thành viên câu lạc bộ.'
        );
    }

    public function canViewAll(User $user): bool
    {
        return $user->isClubMember();
    }

    /**
     * ID của các tài nguyên mà user mở khoá được, hoặc null nếu user xem được tất cả.
     *
     * Cấp thêm suất nếu user chưa dùng hết FREE_LIMIT, rồi trả về tập đã ghim.
     *
     * @return list<int>|null
     */
    public function unlockedIds(User $user): ?array
    {
        if ($this->canViewAll($user)) {
            return null;
        }

        $pinnedIds = $this->pinnedIds($user);

        // Chỉ tính các suất còn trỏ tới tài nguyên đang xuất bản: nếu quản trị
        // viên ẩn/gỡ một tài nguyên đã cấp thì user được cấp bù, không mất suất.
        $liveCount = Resource::query()
            ->whereIn('id', $pinnedIds)
            ->where('status', 'published')
            ->count();

        $missing = self::FREE_LIMIT - $liveCount;

        if ($missing > 0) {
            $granted = $this->grant($user, $pinnedIds, $missing);
            $pinnedIds = [...$pinnedIds, ...$granted];
        }

        return $pinnedIds;
    }

    /**
     * Các suất đã ghim trước đó của user.
     *
     * @return list<int>
     */
    private function pinnedIds(User $user): array
    {
        return ResourceUnlock::query()
            ->where('user_id', $user->id)
            ->pluck('resource_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Ghim thêm $count tài nguyên mới nhất mà user chưa được cấp.
     *
     * @param  list<int>  $excludeIds
     * @return list<int>
     */
    private function grant(User $user, array $excludeIds, int $count): array
    {
        $candidateIds = Resource::query()
            ->where('status', 'published')
            // Tài nguyên của chính user luôn mở khoá qua nhánh uploader_id ở
            // canOpen()/isUnlocked(), nên không tiêu tốn suất miễn phí.
            ->where('uploader_id', '!=', $user->id)
            ->whereNotIn('id', $excludeIds)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($count)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($candidateIds === []) {
            return [];
        }

        $now = now();

        // insertOrIgnore + unique(user_id, resource_id): hai request song song
        // cùng cấp một suất thì bản thứ hai bị bỏ qua thay vì tạo bản trùng.
        ResourceUnlock::query()->insertOrIgnore(array_map(
            fn (int $resourceId) => [
                'user_id' => $user->id,
                'resource_id' => $resourceId,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $candidateIds,
        ));

        return $candidateIds;
    }

    public function canOpen(User $user, Resource $resource): bool
    {
        if ($resource->status !== 'published') {
            return false;
        }

        if (! $this->canBrowse($user)) {
            return false;
        }

        // Người đóng góp luôn mở được tài nguyên của chính mình.
        if ((int) $resource->uploader_id === (int) $user->id) {
            return true;
        }

        $unlockedIds = $this->unlockedIds($user);

        return $unlockedIds === null || in_array((int) $resource->id, $unlockedIds, true);
    }

    public function assertCanOpen(User $user, Resource $resource): void
    {
        $this->assertCanBrowse($user);

        abort_if(
            ! $this->canOpen($user, $resource),
            403,
            'Bạn cần là thành viên câu lạc bộ để mở tài nguyên này.'
        );
    }
}
