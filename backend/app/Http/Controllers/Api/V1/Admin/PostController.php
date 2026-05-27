<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'status', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $status  = $request->query('status');

        $posts = Post::query()
            ->with('user:id,full_name,email,avatar,student_code')
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('posts.title', 'like', "%{$search}%")
                ->orWhere('posts.content', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($status && $status !== 'all', fn ($q) => $q->where('posts.status', $status))
            ->orderBy("posts.{$sort}", $order)
            ->paginate($perPage);

        $posts->getCollection()->transform(fn (Post $post) => $this->transformPost($post));

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $counts = DB::table('posts')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse(true, [
            'total'     => $counts->sum(),
            'published' => (int) ($counts['published'] ?? 0),
            'hidden'    => (int) ($counts['hidden'] ?? 0),
            'pinned'    => 0,
        ], ApiMessage::RETRIEVED);
    }

    public function updateStatus(Request $request, Post $post): JsonResponse
    {
        $request->validate(['status' => 'required|in:published,hidden,draft']);

        $post->update(['status' => $request->string('status')->value()]);

        return $this->successResponse(true, ['status' => $post->status], 'Cập nhật trạng thái bài đăng thành công.');
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return $this->successResponse(true, null, 'Xóa bài đăng thành công.');
    }

    private function transformPost(Post $post): array
    {
        $user = $post->user;

        return [
            'id'              => $post->id,
            'user'            => $user ? [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'avatar'       => $user->avatar,
                'student_code' => $user->student_code,
            ] : null,
            'content'         => $post->content,
            'status'          => $post->status,
            'visibility'      => $post->visibility ?? 'public',
            'is_pinned'       => false,
            'comments_count'  => $post->comments_count ?? 0,
            'reactions_count' => (int) ($post->reactions_count ?? 0),
            'tags'            => [],
            'media'           => [],
            'created_at'      => $post->created_at?->toIso8601String(),
            'updated_at'      => $post->updated_at?->toIso8601String(),
        ];
    }
}
