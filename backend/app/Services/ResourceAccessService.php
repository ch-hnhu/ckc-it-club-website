<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\User;

/**
 * Quy tắc xem tài nguyên trong khu vực cộng đồng:
 *
 * - Thành viên CLB: mở được toàn bộ tài nguyên đã xuất bản.
 * - Sinh viên Cao Thắng: chỉ mở được FREE_LIMIT tài nguyên mới nhất, phần còn
 *   lại vẫn thấy tiêu đề/mô tả nhưng bị khoá liên kết.
 * - Còn lại (khách, tài khoản ngoài trường): không được xem danh sách.
 *
 * Tập tài nguyên mở khoá được tính theo thứ tự created_at desc trên TOÀN BỘ
 * tài nguyên đã xuất bản, cố ý không phụ thuộc vào bộ lọc/tìm kiếm/phân trang
 * của request. Nếu tính theo "3 mục đầu trang hiện tại" thì chỉ cần đổi bộ lọc
 * là mở khoá được lần lượt tất cả tài nguyên.
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
     * @return list<int>|null
     */
    public function unlockedIds(User $user): ?array
    {
        if ($this->canViewAll($user)) {
            return null;
        }

        return Resource::query()
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit(self::FREE_LIMIT)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
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
