<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\User\UpdateProfileRequest;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends BaseApiController
{
    private function formatProfile(User $user): array
    {
        $user->loadMissing(['faculty', 'major', 'class', 'skills']);

        return [
            'id'               => $user->id,
            'full_name'        => $user->full_name,
            'username'         => $user->username,
            'email'            => $user->email,
            'avatar'           => $user->avatar,
            'cover_image'      => $user->cover_image,
            'bio'              => $user->bio,
            'student_code'     => $user->student_code,
            'faculty_id'       => $user->faculty_id,
            'faculty'          => $user->faculty?->label,
            'major_id'         => $user->major_id,
            'major'            => $user->major?->label,
            'class_id'         => $user->class_id,
            'class_name'       => $user->class?->label,
            'gender'           => $user->gender,
            'date_of_birth'    => $user->date_of_birth?->format('Y-m-d'),
            'is_active'        => $user->is_active,
            'posts_count'      => 0,
            'followers_count'  => 0,
            'following_count'  => 0,
            'skills'           => $user->skills->pluck('name')->values(),
            'social_github'    => $user->social_github,
            'social_linkedin'  => $user->social_linkedin,
            'social_instagram' => $user->social_instagram,
            'social_youtube'   => $user->social_youtube,
            'social_tiktok'    => $user->social_tiktok,
            'social_twitch'    => $user->social_twitch,
            'created_at'       => $user->created_at?->format('d/m/Y'),
        ];
    }

    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(true, $this->formatProfile($request->user()), 'Lấy thông tin hồ sơ thành công.');
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $raw = $user->getRawOriginal('avatar');
            if ($raw && ! Str::startsWith($raw, ['http://', 'https://'])) {
                Storage::disk('public')->delete($raw);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } else {
            unset($data['avatar']);
        }

        if ($request->hasFile('cover_image')) {
            $raw = $user->getRawOriginal('cover_image');
            if ($raw) {
                Storage::disk('public')->delete($raw);
            }
            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        } else {
            unset($data['cover_image']);
        }

        // Sync skills when the skills_sync marker is present
        if ($request->input('skills_sync') === '1') {
            $skillIds = Skill::whereIn('name', $data['skills'] ?? [])->pluck('id');
            $user->skills()->sync($skillIds);
        }
        unset($data['skills'], $data['skills_sync']);

        // Nullify empty academic fields so users can clear them
        foreach (['faculty_id', 'major_id', 'class_id'] as $field) {
            if (array_key_exists($field, $data) && empty($data[$field])) {
                $data[$field] = null;
            }
        }

        $user->update(array_intersect_key($data, array_flip($user->getFillable())));

        return $this->successResponse(true, $this->formatProfile($user->refresh()), 'Cập nhật hồ sơ thành công.');
    }

    public function checkUsername(Request $request): JsonResponse
    {
        $username = $request->query('username', '');
        $user = $request->user();

        $taken = User::where('username', $username)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['available' => ! $taken]);
    }

    public function skills(): JsonResponse
    {
        $skills = Skill::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return $this->successResponse(true, $skills, 'Lấy danh sách kỹ năng thành công.');
    }
}
