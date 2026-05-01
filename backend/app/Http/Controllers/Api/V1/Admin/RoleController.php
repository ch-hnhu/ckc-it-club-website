<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class RoleController extends BaseApiController
{
    /**
     * Display a listing of available roles.
     */
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->whereIn('name', RolesEnum::values())
            ->orderByDesc('id')
            ->get(['name'])
            ->map(fn (Role $role) => [
                'value' => $role->name,
                'label' => RolesEnum::from($role->name)->label(),
            ])
            ->values();

        return $this->successResponse(true, $roles, ApiMessage::ROLES_RETRIEVED);
    }
}
