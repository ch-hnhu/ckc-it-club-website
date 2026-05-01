<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\User\StoreUserRequest;
use App\Http\Requests\Api\V1\User\UpdateUserRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends BaseApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $data = User::query()
            ->when($search, function ($query, $search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
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

        $avatarPath = null;

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'gender' => $validated['gender'],
            'student_code' => $validated['student_code'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'faculty_id' => $validated['faculty_id'],
            'major_id' => $validated['major_id'],
            'class_id' => $validated['class_id'],
            'avatar' => $avatarPath,
        ]);

        $user->syncRoles($validated['roles']);

        return $this->successResponse(true, $user, ApiMessage::USER_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::with('roles:id,name')->findOrFail($id);
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
            'gender' => $validated['gender'] ?? null,
            'student_code' => $validated['student_code'] ?? null,
            'email' => $validated['email'],
            'faculty_id' => $validated['faculty_id'] ?? null,
            'major_id' => $validated['major_id'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('avatar')) {
            $rawAvatarPath = $user->getRawOriginal('avatar');
            if ($rawAvatarPath) {
                Storage::disk('public')->delete($rawAvatarPath);
            }

            $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($payload);

        $user->syncRoles($validated['roles']);
        $user->load('roles:id,name');

        return $this->successResponse(true, $user, ApiMessage::USER_UPDATED);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
