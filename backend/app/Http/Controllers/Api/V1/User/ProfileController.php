<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\User\UpdateProfileRequest;
use App\Models\Blog;
use App\Models\Post;
use App\Models\Rank;
use App\Models\Skill;
use App\Models\User;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use Throwable;

class ProfileController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}

    private ?Rank $defaultRank = null;

    private bool $defaultRankLoaded = false;

    private function formatProfile(User $user, ?User $viewer): array
    {
        $user->loadMissing(['faculty', 'major', 'class', 'skills', 'rank']);
        $postsCount = $this->countPosts($user->id, $viewer);
        $blogsCount = $this->countBlogs($user->id);
        $isOwnProfile = $viewer && $viewer->id === $user->id;

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'username' => $user->username,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'cover_image' => $user->cover_image,
            'bio' => $user->bio,
            'student_code' => $user->student_code,
            'faculty_id' => $user->faculty_id,
            'faculty' => $user->faculty?->label,
            'major_id' => $user->major_id,
            'major' => $user->major?->label,
            'class_id' => $user->class_id,
            'class_name' => $user->class?->label,
            'gender' => $user->gender,
            'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
            'is_active' => $user->is_active,
            'total_points' => (int) $user->total_points,
            'current_rank' => $this->formatRankOrDefault($user->rank),
            'posts_count' => $postsCount,
            'blogs_count' => $blogsCount,
            'content_count' => $postsCount + $blogsCount,
            'likes_count' => $this->countLikes($user->id),
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
            'is_following' => $viewer ? $viewer->following()->where('following_id', $user->id)->exists() : false,
            'bookmarks_count' => $isOwnProfile
                ? DB::table('post_bookmarks')->where('user_id', $user->id)->count()
                  + DB::table('blog_bookmarks')->where('user_id', $user->id)->count()
                : null,
            'archived_count' => $isOwnProfile
                ? Post::where('user_id', $user->id)->where('status', 'archived')->count()
                  + Blog::where('author_id', $user->id)->where('status', 'archived')->count()
                : null,
            'skills' => $user->skills->pluck('name')->values(),
            'is_school_student' => $user->isSchoolStudent(),
            'social_github' => $user->social_github,
            'social_linkedin' => $user->social_linkedin,
            'social_instagram' => $user->social_instagram,
            'social_youtube' => $user->social_youtube,
            'social_tiktok' => $user->social_tiktok,
            'social_twitch' => $user->social_twitch,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    #[OA\Get(
        path: '/v1/users/profile',
        summary: 'Lấy hồ sơ đầy đủ của user đang đăng nhập',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 401, description: 'Chưa đăng nhập', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(true, $this->formatProfile($request->user(), $request->user()), 'Lấy thông tin hồ sơ thành công.');
    }

    #[OA\Post(
        path: '/v1/users/profile',
        summary: 'Cập nhật hồ sơ user (multipart/form-data — hỗ trợ upload avatar/cover_image)',
        description: 'Các trường học vụ (student_code, faculty_id, major_id, class_id) chỉ áp dụng cho sinh viên trường (email @caothang.edu.vn).',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(properties: [
                    new OA\Property(property: 'full_name', type: 'string', maxLength: 255, nullable: true),
                    new OA\Property(property: 'username', type: 'string', maxLength: 30, nullable: true, description: 'Chỉ chữ thường, số, gạch dưới'),
                    new OA\Property(property: 'bio', type: 'string', maxLength: 500, nullable: true),
                    new OA\Property(property: 'student_code', type: 'string', maxLength: 15, nullable: true),
                    new OA\Property(property: 'faculty_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'major_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'class_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'gender', type: 'string', enum: ['Nam', 'Nữ', 'Khác'], nullable: true),
                    new OA\Property(property: 'date_of_birth', type: 'string', format: 'date', nullable: true),
                    new OA\Property(property: 'avatar', type: 'string', format: 'binary', nullable: true, description: 'Ảnh, tối đa 5MB'),
                    new OA\Property(property: 'cover_image', type: 'string', format: 'binary', nullable: true, description: 'Ảnh, tối đa 5MB'),
                    new OA\Property(property: 'skills_sync', type: 'string', nullable: true, description: 'Truyền "1" để đồng bộ mảng skills'),
                    new OA\Property(property: 'skills', type: 'array', items: new OA\Items(type: 'string'), nullable: true),
                    new OA\Property(property: 'social_github', type: 'string', maxLength: 100, nullable: true),
                    new OA\Property(property: 'social_linkedin', type: 'string', maxLength: 100, nullable: true),
                    new OA\Property(property: 'social_instagram', type: 'string', maxLength: 100, nullable: true),
                    new OA\Property(property: 'social_youtube', type: 'string', maxLength: 100, nullable: true),
                    new OA\Property(property: 'social_tiktok', type: 'string', maxLength: 100, nullable: true),
                    new OA\Property(property: 'social_twitch', type: 'string', maxLength: 100, nullable: true),
                ])
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Cập nhật thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $raw = $user->getRawOriginal('avatar');
            if ($raw) {
                $this->storage->delete($raw);
            }
            $data['avatar'] = $this->storage->uploadImage($request->file('avatar'), 'avatars');
        } else {
            unset($data['avatar']);
        }

        if ($request->hasFile('cover_image')) {
            $raw = $user->getRawOriginal('cover_image');
            if ($raw) {
                $this->storage->delete($raw);
            }
            $data['cover_image'] = $this->storage->uploadImage($request->file('cover_image'), 'covers');
        } else {
            unset($data['cover_image']);
        }

        // Sync skills when the skills_sync marker is present
        if ($request->input('skills_sync') === '1') {
            $skillIds = Skill::whereIn('name', $data['skills'] ?? [])->pluck('id');
            $user->skills()->sync($skillIds);
        }
        unset($data['skills'], $data['skills_sync']);

        // Chỉ sinh viên trường (mail @caothang.edu.vn) mới được cập nhật thông tin học vụ
        if (! $user->isSchoolStudent()) {
            foreach (['student_code', 'faculty_id', 'major_id', 'class_id'] as $field) {
                unset($data[$field]);
            }
        }

        // Nullify empty academic fields so users can clear them
        foreach (['faculty_id', 'major_id', 'class_id'] as $field) {
            if (array_key_exists($field, $data) && empty($data[$field])) {
                $data[$field] = null;
            }
        }

        $user->update(array_intersect_key($data, array_flip($user->getFillable())));

        return $this->successResponse(true, $this->formatProfile($user->refresh(), $request->user()), 'Cập nhật hồ sơ thành công.');
    }

    /**
     * Trả về trạng thái sinh viên của user hiện tại.
     * Dùng để kiểm tra quyền truy cập tính năng và phân quyền.
     */
    #[OA\Get(
        path: '/v1/users/check-school-student',
        summary: 'Kiểm tra user hiện tại có phải sinh viên trường (email @caothang.edu.vn) không',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'is_school_student', type: 'boolean'),
                        new OA\Property(property: 'email_domain', type: 'string', example: 'caothang.edu.vn'),
                    ], type: 'object'),
                ])
            ),
        ]
    )]
    public function checkSchoolStudent(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->successResponse(true, [
            'is_school_student' => $user->isSchoolStudent(),
            'email_domain' => substr(strrchr($user->email, '@'), 1),
        ], 'Kiểm tra thành công.');
    }

    #[OA\Get(
        path: '/v1/users/check-username',
        summary: 'Kiểm tra username đã được sử dụng chưa (loại trừ chính user hiện tại)',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'available', type: 'boolean'),
                ])
            ),
        ]
    )]
    public function checkUsername(Request $request): JsonResponse
    {
        $username = $request->query('username', '');
        $user = $request->user();

        $taken = User::where('username', $username)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json(['available' => ! $taken]);
    }

    /**
     * Public profile — no auth required.
     * Returns 404 with a clear message if username is not found (active).
     */
    #[OA\Get(
        path: '/v1/users/profile/{username}',
        summary: 'Xem hồ sơ công khai của một user theo username (public, không cần đăng nhập)',
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy người dùng', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function showPublic(Request $request, string $username): JsonResponse
    {
        // Tìm theo username trước; nếu không có thì fallback theo email prefix
        // (vì buildProfileUrl() dùng email.split("@")[0] khi user chưa đặt username)
        $user = User::where('is_active', true)
            ->where(function ($q) use ($username) {
                $q->where('username', $username)
                    ->orWhere('email', 'like', "{$username}@%");
            })
            ->first();

        if (! $user) {
            return $this->errorResponse(
                false,
                'Không tìm thấy người dùng.',
                HttpStatus::NOT_FOUND
            );
        }

        return $this->successResponse(true, $this->formatProfile($user, $request->user('sanctum')), 'Lấy thông tin hồ sơ thành công.');
    }

    #[OA\Get(
        path: '/v1/users/skills',
        summary: 'Lấy danh sách kỹ năng (skills) đang active để chọn khi cập nhật hồ sơ',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
    public function skills(): JsonResponse
    {
        $skills = Skill::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return $this->successResponse(true, $skills, 'Lấy danh sách kỹ năng thành công.');
    }

    /** Tổng posts đã published của user */
    private function countPosts(int $userId, ?User $viewer): int
    {
        return Post::query()
            ->where('user_id', $userId)
            ->where('status', 'published')
            ->visibleTo($viewer)
            ->count();
    }

    /** Tổng blogs đã published của user */
    private function countBlogs(int $userId): int
    {
        return DB::table('blogs')->where('author_id', $userId)->where('status', 'published')->count();
    }

    /** Tổng lượt react trên tất cả posts + blogs của user */
    private function countLikes(int $userId): int
    {
        $postIds = DB::table('posts')->where('user_id', $userId)->pluck('id');
        $blogIds = DB::table('blogs')->where('author_id', $userId)->pluck('id');

        return DB::table('reactions')
            ->where(function ($q) use ($postIds, $blogIds) {
                $q->where(function ($q2) use ($postIds) {
                    $q2->where('target_type', 'post')->whereIn('target_id', $postIds);
                })->orWhere(function ($q2) use ($blogIds) {
                    $q2->where('target_type', 'blog')->whereIn('target_id', $blogIds);
                });
            })
            ->count();
    }

    private function formatRank(?Rank $rank): ?array
    {
        if (! $rank) {
            return null;
        }

        return [
            'id' => $rank->id,
            'name' => $rank->name,
            'badge' => $this->badgeUrl($rank->badge),
            'min_points' => $rank->min_points,
        ];
    }

    private function formatRankOrDefault(?Rank $rank): ?array
    {
        return $this->formatRank($rank ?? $this->defaultRank());
    }

    private function defaultRank(): ?Rank
    {
        if (! $this->defaultRankLoaded) {
            $this->defaultRank = Rank::query()->orderBy('min_points')->first();
            $this->defaultRankLoaded = true;
        }

        return $this->defaultRank;
    }

    private function badgeUrl(?string $badge): ?string
    {
        // DB now stores the full public URL (Supabase https://... or external).
        return $badge ?: null;
    }

    /**
     * Permanently delete the authenticated user's own account.
     * Revokes all tokens first, then deletes the user record.
     */
    #[OA\Delete(
        path: '/v1/users/account',
        summary: 'Xoá vĩnh viễn tài khoản của chính user đang đăng nhập',
        description: 'Thu hồi toàn bộ token, xoá avatar/cover trên storage rồi xoá bản ghi user. Không thể hoàn tác.',
        security: [['sanctum' => []]],
        tags: ['User Profile'],
        responses: [
            new OA\Response(response: 200, description: 'Xoá thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 500, description: 'Lỗi khi xoá tài khoản', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            DB::transaction(function () use ($user) {
                // Revoke all Sanctum tokens
                $user->tokens()->delete();

                // Delete avatar / cover from Supabase storage
                foreach (['avatar', 'cover_image'] as $field) {
                    $raw = $user->getRawOriginal($field);
                    if ($raw) {
                        $this->storage->delete($raw);
                    }
                }

                $user->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Tài khoản đã được xoá thành công.',
            ]);
        } catch (Throwable $e) {
            \Log::error('Delete account error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Không thể xoá tài khoản. Vui lòng thử lại.',
            ], 500);
        }
    }
}
