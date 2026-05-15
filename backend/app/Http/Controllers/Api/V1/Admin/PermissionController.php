<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $permission = Permission::query()
            ->with('roles:id,name,label')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $order)
            ->paginate($perPage);

        return $this->paginatedResponse($permission, ApiMessage::RETRIEVED);
    }
}
