<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'id');
        $order = $request->query('order', 'desc');
        $perPage = (int) $request->query('per_page', 0);
        $search = $request->query('search');

        $allowedSorts = ['id', 'name', 'created_at', 'total_users'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $roles = Role::query()
            ->whereIn('name', RolesEnum::values())
            ->select('id', 'name', 'created_at')
            ->get()
            ->map(function (Role $role) {
                $label = RolesEnum::from($role->name)->label();

                return [
                    'id' => $role->id,
                    'value' => $role->name,
                    'label' => $label,
                    'created_at' => $role->created_at?->format('d/m/Y'),
                    'total_users' => (int) DB::table('model_has_roles')->where('role_id', $role->id)->count(),
                    '__sort_label' => $label,
                    '__sort_created_at' => $role->created_at?->getTimestamp() ?? 0,
                ];
            });

        if ($search) {
            $searchTerm = mb_strtolower($search);
            $roles = $roles->filter(function (array $role) use ($searchTerm) {
                return str_contains(mb_strtolower($role['value']), $searchTerm)
                    || str_contains(mb_strtolower($role['label']), $searchTerm);
            })->values();
        }

        $roles = $this->sortRoles($roles, $sort, $order)->map(fn (array $role) => Arr::except($role, ['__sort_label', '__sort_created_at']));

        if ($perPage > 0) {
            $page = LengthAwarePaginator::resolveCurrentPage();
            $items = $roles->forPage($page, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $items,
                $roles->count(),
                $perPage,
                $page,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]
            );

            return $this->paginatedResponse($paginator, ApiMessage::ROLES_RETRIEVED);
        }

        return $this->successResponse(true, $roles, ApiMessage::ROLES_RETRIEVED);
    }

    private function sortRoles($roles, string $sort, string $order)
    {
        return match ($sort) {
            'name' => $roles->sortBy(
                fn (array $role) => $role['__sort_label'],
                SORT_NATURAL | SORT_FLAG_CASE,
                $order === 'desc'
            )->values(),
            'created_at' => $roles->sortBy(
                fn (array $role) => $role['__sort_created_at'],
                SORT_NUMERIC,
                $order === 'desc'
            )->values(),
            'total_users' => $roles->sortBy(
                fn (array $role) => $role['total_users'],
                SORT_NUMERIC,
                $order === 'desc'
            )->values(),
            default => $roles->sortBy(
                fn (array $role) => $role['id'],
                SORT_NUMERIC,
                $order === 'desc'
            )->values(),
        };
    }
}
