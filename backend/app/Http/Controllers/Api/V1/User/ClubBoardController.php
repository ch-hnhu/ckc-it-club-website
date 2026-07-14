<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ClubBoardController extends BaseApiController
{
    /**
     * Các role thuộc Ban Chủ Nhiệm, theo đúng thứ tự hiển thị.
     *
     * @var array<int, RolesEnum>
     */
    private array $boardRoles = [
        RolesEnum::PRESIDENT,
        RolesEnum::VICE_PRESIDENT,
        RolesEnum::ACADEMIC_HEAD,
        RolesEnum::COMMUNICATIONS_HEAD,
        RolesEnum::VOLUNTEER_HEAD,
    ];

    /**
     * Danh sách Ban Chủ Nhiệm cho landing page (public, không cần đăng nhập).
     *
     * Trả về các thành viên đang giữ vai trò lãnh đạo (chủ nhiệm, phó chủ nhiệm,
     * trưởng các ban), sắp xếp theo cấp bậc trong $boardRoles.
     */
    public function index(): JsonResponse
    {
        // name => thứ tự ưu tiên (nhỏ hơn = cao hơn)
        $priority = [];
        foreach ($this->boardRoles as $index => $role) {
            $priority[$role->value] = $index;
        }

        $members = User::query()
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->whereIn('roles.name', array_keys($priority)))
            ->with(['roles' => fn ($q) => $q->whereIn('roles.name', array_keys($priority))])
            ->get()
            ->map(function (User $user) use ($priority) {
                // Chọn role lãnh đạo cao nhất mà user đang giữ
                $leadRole = $user->roles
                    ->filter(fn ($role) => isset($priority[$role->name]))
                    ->sortBy(fn ($role) => $priority[$role->name])
                    ->first();

                if (! $leadRole) {
                    return null;
                }

                return [
                    'full_name'  => $user->full_name,
                    'username'   => $user->username,
                    'avatar'     => $user->avatar,
                    'role_name'  => $leadRole->name,
                    'role_label' => $leadRole->label
                        ?? RolesEnum::from($leadRole->name)->label(),
                    'priority'   => $priority[$leadRole->name],
                ];
            })
            ->filter()
            ->sortBy('priority')
            ->values()
            ->map(function (array $item) {
                unset($item['priority']);

                return $item;
            });

        return $this->successResponse(true, $members, ApiMessage::RETRIEVED);
    }
}
