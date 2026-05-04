<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Role\StoreRoleRequest;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $allowedSorts = ['id', 'label', 'created_at', 'total_users'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $query = Role::query()
            ->select('id', 'name', 'label', 'created_at');

        if ($search) {
            $searchTerm = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                ->orWhereRaw('LOWER(label) LIKE ?', [$searchTerm]);
        }

        // Apply sorting at database level for created_at, label, and total_users
        if ($sort === 'created_at') {
            $query->orderBy('created_at', $order);
        } elseif ($sort === 'label') {
            $query->orderBy('label', $order);
        } elseif ($sort === 'id') {
            $query->orderBy('id', $order);
        }

        $roles = $query->get()
            ->map(function (Role $role) {
                return [
                    'id' => $role->id,
                    'value' => $role->name,
                    'label' => $role->label,
                    'created_at' => $role->created_at?->format('d/m/Y'),
                    'total_users' => (int) DB::table('model_has_roles')->where('role_id', $role->id)->count(),
                ];
            });

        // Only need to sort by total_users at application level
        if ($sort === 'total_users') {
            $roles = $this->sortRolesByTotalUsers($roles, $order);
        }

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

    private function sortRolesByTotalUsers($roles, string $order)
    {
        return $roles->sortBy(
            fn (array $role) => $role['total_users'],
            SORT_NUMERIC,
            $order === 'desc'
        )->values();
    }

    public function store(StoreRoleRequest $request)
    {
        $validated = $request->validated();

        $user = Role::create([
            'name' => $validated['name'],
            'label' => $validated['label'],
            'guard_name' => 'web',
            'is_system' => $validated['is_system'],
        ]);

        return $this->successResponse(true, $user, ApiMessage::ROLE_CREATED);
    }
}
