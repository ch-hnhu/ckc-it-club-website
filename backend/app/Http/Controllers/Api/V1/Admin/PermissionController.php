<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Enums\RolesEnum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');
        $roles = $request->input('roles', []);

        $permission = Permission::query()
            ->with('roles:id,name,label')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(!empty($roles), function ($query) use ($roles) {
                $query->whereHas('roles', function ($q) use ($roles) {
                    $q->whereIn('name', $roles);
                });
            })
            ->orderBy($sort, $order)
            ->paginate($perPage);

        return $this->paginatedResponse($permission, ApiMessage::RETRIEVED);
    }

    public function syncRoles(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'roles'   => ['present', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        if (! in_array(RolesEnum::ADMIN->value, $validated['roles'], true)) {
            return $this->errorResponse(false, 'Không thể xóa vai trò Quản trị viên khỏi bất kỳ quyền nào.', 422);
        }

        $roleIds = Role::whereIn('name', $validated['roles'])->pluck('id');
        $permission->roles()->sync($roleIds);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permission->load('roles:id,name,label');

        return $this->successResponse(true, [
            'id'          => $permission->id,
            'name'        => $permission->name,
            'description' => $permission->description,
            'roles'       => $permission->roles->map(fn ($r) => [
                'id'    => $r->id,
                'name'  => $r->name,
                'label' => $r->label,
            ])->values(),
            'created_at'  => $permission->created_at,
        ], ApiMessage::PERMISSIONS_UPDATED);
    }
}
