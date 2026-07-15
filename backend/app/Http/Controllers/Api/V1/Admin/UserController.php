<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\User\StoreUserRequest;
use App\Http\Requests\Api\V1\User\UpdateUserRequest;
use App\Services\SupabaseStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');
        $role = $request->query('role');

        $data = User::query()
            ->with('roles:id,name,label')
            ->when($search, function ($query, $search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($role, function ($query, $role) {
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->orderBy($sort, $order)
            ->paginate($perPage);

        return $this->paginatedResponse($data, ApiMessage::USERS_RETRIEVED);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $avatarUrl = null;

        if ($request->hasFile('avatar')) {
            $avatarUrl = $this->storage->uploadImage($request->file('avatar'), 'avatars');
        }

        $user = null;

        DB::transaction(function () use ($validated, $avatarUrl, &$user) {
            $user = User::create([
                'full_name' => $validated['full_name'],
                'username' => $validated['username'],
                'gender' => $validated['gender'],
                'student_code' => $validated['student_code'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_active' => $validated['is_active'],
                'faculty_id' => $validated['faculty_id'] ?? null,
                'major_id' => $validated['major_id'] ?? null,
                'class_id' => $validated['class_id'] ?? null,
                'avatar' => $avatarUrl,
            ]);

            $user->syncRoles($validated['roles']);
            $this->syncDepartmentHeadAssignments($user, $validated['roles']);
        });

        return $this->successResponse(true, $user, ApiMessage::USER_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::with('roles:id,name,label')->findOrFail($id);
        return $this->successResponse(true, $user, ApiMessage::USER_RETRIEVED);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, string $id)
    {
        $validated = $request->validated();
        $user = User::findOrFail($id);

        $payload = [
            'full_name' => $validated['full_name'],
            'username' => $validated['username'],
            'gender' => $validated['gender'] ?? null,
            'student_code' => $validated['student_code'] ?? null,
            'email' => $validated['email'],
            'is_active' => $validated['is_active'],
            'faculty_id' => $validated['faculty_id'] ?? null,
            'major_id' => $validated['major_id'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar from Supabase (raw value is the full URL after migration)
            $oldAvatar = $user->getRawOriginal('avatar');
            if ($oldAvatar) {
                $this->storage->delete($oldAvatar);
            }

            $payload['avatar'] = $this->storage->uploadImage($request->file('avatar'), 'avatars');
        }

        DB::transaction(function () use ($user, $payload, $validated) {
            $user->update($payload);
            $user->syncRoles($validated['roles']);
            $this->syncDepartmentHeadAssignments($user, $validated['roles']);
        });

        if (! empty($validated['password'])) {
            $type = \App\Models\MailTemplateType::where('slug', 'reset_password')
                ->with(['mailTemplates' => fn ($q) => $q->where('is_default', true)->whereNull('deleted_at')])
                ->first();

            if ($type && $template = $type->mailTemplates->first()) {
                $info = \App\Models\ClubInformation::where('slug', 'club-name')->first();
                $clubName = $info ? ($info->clubInformationValues()->where('is_active', true)->value('value') ?? 'CKC IT CLUB') : 'CKC IT CLUB';

                $variables = [
                    '{{user_name}}' => $user->full_name,
                    '{{club_name}}' => $clubName,
                    '{{new_password}}' => $validated['password'],
                ];
                $subject = str_replace(array_keys($variables), array_values($variables), $template->subject);
                $body    = str_replace(array_keys($variables), array_values($variables), $template->body);

                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\ApplicationStatusMail($subject, $body));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send reset password email: " . $e->getMessage());
                }
            }
        }

        $user->load('roles:id,name');

        return $this->successResponse(true, $user, ApiMessage::USER_UPDATED);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $oldAvatar = $user->getRawOriginal('avatar');
        if ($oldAvatar) {
            $this->storage->delete($oldAvatar);
        }

        $user->delete();

        return $this->successResponse(true, null, ApiMessage::USER_DELETED);
    }

    private function syncDepartmentHeadAssignments(User $user, array $roleNames): void
    {
        $selectedRoles = collect($roleNames);

        Department::query()
            ->with('headRole:id,name,label,guard_name')
            ->whereNotNull('head_role_id')
            ->get()
            ->each(function (Department $department) use ($user, $selectedRoles) {
                $headRole = $department->headRole;

                if (! $headRole || ! $selectedRoles->contains($headRole->name)) {
                    return;
                }

                if (! $department->members()->where('users.id', $user->id)->exists()) {
                    $department->members()->attach($user->id, ['joined_at' => now()]);
                }

                User::role($headRole)
                    ->whereKeyNot($user->id)
                    ->get()
                    ->each(fn (User $otherUser) => $otherUser->removeRole($headRole));
            });
    }
}
