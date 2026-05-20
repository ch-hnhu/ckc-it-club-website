<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\PermissionsEnum;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Role\StoreRoleRequest;
use App\Http\Requests\Api\V1\Role\SyncRolePermissionsRequest;
use App\Http\Requests\Api\V1\Role\UpdateRoleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
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

        $allowedSorts = ['id', 'name', 'label', 'is_system', 'created_at', 'total_users'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $query = Role::query()
            ->select('id', 'name', 'label', 'created_at', 'is_system');

        if ($search) {
            $searchTerm = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                ->orWhereRaw('LOWER(label) LIKE ?', [$searchTerm]);
        }

        if ($sort === 'created_at') {
            $query->orderBy('created_at', $order);
        } elseif ($sort === 'name') {
            $query->orderBy('name', $order);
        } elseif ($sort === 'label') {
            $query->orderBy('label', $order);
        } elseif ($sort === 'is_system') {
            $query->orderBy('is_system', $order);
        } elseif ($sort === 'id') {
            $query->orderBy('id', $order);
        }

        $roles = $query->get()
            ->map(function (Role $role) {
                return [
                    'id' => $role->id,
                    'value' => $role->name,
                    'label' => $role->label,
                    'is_system' => (int) $role->is_system,
                    'created_at' => $role->created_at?->format('d/m/Y'),
                    'total_users' => (int) DB::table('model_has_roles')->where('role_id', $role->id)->count(),
                ];
            });

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

    public function show(string $id)
    {
        $role = Role::with('permissions:id,name,description')->findOrFail($id);

        $data = [
            'id' => $role->id,
            'value' => $role->name,
            'label' => $role->label,
            'is_system' => (int) $role->is_system,
            'created_at' => $role->created_at?->format('d/m/Y'),
            'total_users' => (int) DB::table('model_has_roles')->where('role_id', $role->id)->count(),
            'permissions' => $role->permissions->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
            ])->values(),
        ];

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    public function update(UpdateRoleRequest $request, string $id)
    {
        $validated = $request->validated();

        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->errorResponse(false, ApiMessage::CANNOT_UPDATE_SYSTEM_ROLE, 403);
        }

        $hasUsers = DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->count() > 0;

        if ($hasUsers) {
            return $this->errorResponse(false, ApiMessage::CANNOT_UPDATE_ROLE_WITH_USERS, 403);
        }

        $role->name = $validated['name'];
        $role->label = $validated['label'];
        $role->is_system = $validated['is_system'];
        $role->save();

        $data = [
            'id' => $role->id,
            'value' => $role->name,
            'label' => $role->label,
            'is_system' => (int) $role->is_system,
            'created_at' => $role->created_at?->format('d/m/Y'),
            'total_users' => (int) DB::table('model_has_roles')->where('role_id', $role->id)->count(),
        ];

        return $this->successResponse(true, $data, ApiMessage::UPDATED);
    }

    public function destroy(string $id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->errorResponse(false, ApiMessage::ROLE_SYSTEM, 503);
        }

        $hasUsers = DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->exists();

        if ($hasUsers) {
            return $this->errorResponse(false, ApiMessage::CANNOT_DELETE_ROLE_WITH_USERS, 403);
        }

        $role->delete();

        return $this->successResponse(true, null, ApiMessage::ROLE_DELETED);
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        $permNames = $request->validated()['permissions'];

        if ($role->name === RolesEnum::ADMIN->value
            && ! in_array(PermissionsEnum::ADMIN_PANEL_ACCESS->value, $permNames, true)) {
            return $this->errorResponse(false, ApiMessage::CANNOT_REMOVE_ADMIN_PANEL_ACCESS, 403);
        }

        $role->syncPermissions($permNames);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $role->load('permissions:id,name,description');

        return $this->successResponse(true, [
            'id' => $role->id,
            'value' => $role->name,
            'label' => $role->label,
            'permissions' => $role->permissions->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
            ])->values(),
        ], ApiMessage::PERMISSIONS_UPDATED);
    }
}
