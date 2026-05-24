<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Department\StoreDepartmentRequest;
use App\Http\Requests\Api\V1\Department\StoreDepartmentUserRequest;
use App\Http\Requests\Api\V1\Department\UpdateDepartmentRequest;
use App\Http\Requests\Api\V1\Department\UpdateDepartmentUserRoleRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DepartmentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'slug', 'is_active', 'created_at', 'updated_at', 'users_count'];
        $sort  = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        if (! in_array($order, ['asc', 'desc'], true)) {
            $order = 'desc';
        }

        $departments = Department::query()
            ->withCount('members')
            ->with('headRole:id,name,label')
            ->when($search, function ($query, $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort === 'users_count' ? 'members_count' : $sort, $order)
            ->paginate($perPage);

        $departments->getCollection()->transform(fn (Department $department) => [
            'id'          => $department->id,
            'name'        => $department->name,
            'slug'        => $department->slug,
            'description' => $department->description,
            'is_active'   => (bool) $department->is_active,
            'head_role'   => $department->headRole
                ? [
                    'id'    => $department->headRole->id,
                    'name'  => $department->headRole->name,
                    'label' => $department->headRole->label,
                ]
                : null,
            'users_count' => $department->members_count,
            'created_at'  => $department->created_at?->format('d/m/Y'),
            'updated_at'  => $department->updated_at?->format('d/m/Y'),
        ]);

        return $this->paginatedResponse($departments, ApiMessage::RETRIEVED);
    }

    public function show(Department $department): JsonResponse
    {
        $department->load('headRole:id,name,label');
        $department->loadCount('members');

        // Eager-load thành viên kèm Spatie roles để tránh N+1
        $members = $department->members()
            ->with('roles:id,name,label')
            ->orderBy('department_user.joined_at', 'asc')
            ->orderBy('users.id', 'asc')
            ->get()
            ->map(fn (User $user) => [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
                'avatar'    => $user->avatar,
                'is_active' => (bool) $user->is_active,
                'is_head'   => $department->head_role_id !== null
                    && $user->roles->contains('id', $department->head_role_id),
                'department_role' => $department->headRole
                    && $user->roles->contains('id', $department->head_role_id)
                    ? [
                        'id'    => $department->headRole->id,
                        'name'  => $department->headRole->name,
                        'label' => $department->headRole->label,
                    ]
                    : [
                        'id'    => null,
                        'name'  => null,
                        'label' => 'Thành viên',
                    ],
                'joined_at' => $user->pivot->joined_at?->format('d/m/Y'),
            ])
            // Head lên đầu danh sách
            ->sortByDesc('is_head')
            ->values();

        return $this->successResponse(true, [
            'id'          => $department->id,
            'name'        => $department->name,
            'slug'        => $department->slug,
            'description' => $department->description,
            'is_active'   => (bool) $department->is_active,
            'head_role'   => $department->headRole
                ? [
                    'id'    => $department->headRole->id,
                    'name'  => $department->headRole->name,
                    'label' => $department->headRole->label,
                ]
                : null,
            'users_count' => $department->members_count,
            'created_at'  => $department->created_at?->format('d/m/Y'),
            'updated_at'  => $department->updated_at?->format('d/m/Y'),
            'users'       => $members,
        ], ApiMessage::RETRIEVED);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $name = trim($request->string('name')->value());

        $department = Department::query()->create([
            'name'         => $name,
            'slug'         => Str::slug($name),
            'description'  => $request->filled('description')
                ? trim($request->string('description')->value())
                : null,
            'is_active'    => $request->boolean('is_active', true),
            'head_role_id' => $request->filled('head_role_id')
                ? $request->integer('head_role_id')
                : null,
            'created_by'   => $request->user()?->id,
            'updated_by'   => $request->user()?->id,
        ]);

        $department->load('headRole:id,name,label');
        $department->loadCount('members');

        return $this->createdResponse($department, 'Tạo ban thành công.');
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $name = trim($request->string('name')->value());

        $department->update([
            'name'         => $name,
            'slug'         => Str::slug($name),
            'description'  => $request->filled('description')
                ? trim($request->string('description')->value())
                : null,
            'is_active'    => $request->boolean('is_active', true),
            'head_role_id' => $request->has('head_role_id')
                ? ($request->filled('head_role_id') ? $request->integer('head_role_id') : null)
                : $department->head_role_id,
            'updated_by'   => $request->user()?->id,
        ]);

        $department->load('headRole:id,name,label');
        $department->loadCount('members');

        return $this->successResponse(true, $department, 'Cập nhật ban thành công.');
    }

    public function storeUser(StoreDepartmentUserRequest $request, Department $department): JsonResponse
    {
        $userId = $request->integer('user_id');

        $alreadyMember = $department->members()
            ->where('users.id', $userId)
            ->exists();

        if ($alreadyMember) {
            return $this->validationErrorResponse([
                'user_id' => ['Thành viên đã thuộc ban này.'],
            ]);
        }

        $department->members()->attach($userId, [
            'joined_at' => $request->filled('joined_at')
                ? $request->date('joined_at')
                : now(),
        ]);

        $department->loadCount('members');

        return $this->successResponse(true, $department, 'Thêm thành viên vào ban thành công.');
    }

    public function updateUserRole(
        UpdateDepartmentUserRoleRequest $request,
        Department $department,
        User $user,
    ): JsonResponse {
        $membershipExists = $department->members()
            ->where('users.id', $user->id)
            ->exists();

        if (! $membershipExists) {
            return $this->notFoundResponse('ThÃ nh viÃªn khÃ´ng thuá»™c ban nÃ y.');
        }

        $headRole = $department->headRole;

        if (! $headRole) {
            return $this->validationErrorResponse([
                'is_head' => ['Ban này chưa cấu hình role trưởng ban.'],
            ]);
        }

        $isHead = $request->boolean('is_head');

        DB::transaction(function () use ($department, $user, $headRole, $isHead) {
            if ($isHead) {
                $department->members()
                    ->where('users.id', '<>', $user->id)
                    ->whereHas('roles', fn ($query) => $query->where('roles.id', $headRole->id))
                    ->get()
                    ->each(fn (User $member) => $member->removeRole($headRole));

                if (! $user->hasRole($headRole)) {
                    $user->assignRole($headRole);
                }

                return;
            }

            if ($user->hasRole($headRole)) {
                $user->removeRole($headRole);
            }
        });

        $department->loadCount('members');

        return $this->successResponse(true, $department, 'Cáº­p nháº­t vai trÃ² thÃ nh viÃªn thÃ nh cÃ´ng.');
    }

    public function destroyUser(Department $department, User $user): JsonResponse
    {
        $headRole = $department->headRole;

        $deleted = DB::transaction(function () use ($department, $headRole, $user) {
            $deleted = $department->members()->detach($user->id);

            if ($deleted > 0 && $headRole && $user->hasRole($headRole->name)) {
                $user->removeRole($headRole->name);
            }

            return $deleted;
        });

        if ($deleted === 0) {
            return $this->notFoundResponse('Thành viên không thuộc ban này.');
        }

        $department->loadCount('members');

        return $this->successResponse(true, $department, 'Xóa thành viên khỏi ban thành công.');
    }
}
