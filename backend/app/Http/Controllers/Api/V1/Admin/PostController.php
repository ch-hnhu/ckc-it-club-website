<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'status', 'created_at', 'reactions_count', 'user_name', 'channel_name'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $status  = $request->query('status');

        $posts = Post::query()
            ->with('user:id,full_name,email,avatar,student_code', 'channel:id,name,slug')
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('posts.title', 'like', "%{$search}%")
                ->orWhere('posts.content', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($status && $status !== 'all', fn ($q) => $q->where('posts.status', $status))
            ->when(in_array($sort, ['id', 'status', 'created_at']), fn ($q) => $q->orderBy("posts.{$sort}", $order))
            ->when($sort === 'reactions_count', fn ($q) => $q->orderBy('reactions_count', $order))
            ->when($sort === 'user_name', fn ($q) => $q->orderByRaw("(SELECT COALESCE(full_name, email) FROM users WHERE users.id = posts.user_id) {$order}"))
            ->when($sort === 'channel_name', fn ($q) => $q->orderByRaw("(SELECT name FROM channels WHERE channels.id = posts.channel_id) {$order}"))
            ->paginate($perPage);

        $posts->getCollection()->transform(fn (Post $post) => $this->transformPost($post));

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function trash(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'status', 'created_at', 'reactions_count', 'user_name', 'channel_name'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $status  = $request->query('status');

        $posts = Post::onlyTrashed()
            ->with('user:id,full_name,email,avatar,student_code', 'channel:id,name,slug')
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('posts.title', 'like', "%{$search}%")
                ->orWhere('posts.content', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($status && $status !== 'all', fn ($q) => $q->where('posts.status', $status))
            ->when(in_array($sort, ['id', 'status', 'created_at']), fn ($q) => $q->orderBy("posts.{$sort}", $order))
            ->when($sort === 'reactions_count', fn ($q) => $q->orderBy('reactions_count', $order))
            ->when($sort === 'user_name', fn ($q) => $q->orderByRaw("(SELECT COALESCE(full_name, email) FROM users WHERE users.id = posts.user_id) {$order}"))
            ->when($sort === 'channel_name', fn ($q) => $q->orderByRaw("(SELECT name FROM channels WHERE channels.id = posts.channel_id) {$order}"))
            ->paginate($perPage);

        $posts->getCollection()->transform(fn (Post $post) => $this->transformPost($post));

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $counts = Post::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse(true, [
            'total'     => $counts->sum(),
            'published' => (int) ($counts['published'] ?? 0),
            'hidden'    => (int) ($counts['hidden'] ?? 0),
            'archived'  => (int) ($counts['archived'] ?? 0),
        ], ApiMessage::RETRIEVED);
    }

    public function updateStatus(Request $request, Post $post): JsonResponse
    {
        $request->validate(['status' => 'required|in:published,hidden,draft,archived']);

        $post->update(['status' => $request->string('status')->value()]);

        return $this->successResponse(true, ['status' => $post->status], 'Cập nhật trạng thái bài đăng thành công.');
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->deleted_by = request()->user()?->id;
        $post->save();
        $post->delete();

        return $this->successResponse(true, null, 'Xóa bài đăng thành công.');
    }

    public function restore(int $post): JsonResponse
    {
        $post = Post::onlyTrashed()->findOrFail($post);
        $post->restore();

        return $this->successResponse(true, $this->transformPost($post), 'Khôi phục bài đăng thành công.');
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);

        if (empty($ids) || ! is_array($ids)) {
            return $this->validationErrorResponse(['ids' => ['Danh sách ID không hợp lệ.']]);
        }

        $deleted = Post::query()->whereIn('id', $ids)->each(function (Post $post) use ($request) {
            $post->deleted_by = $request->user()?->id;
            $post->save();
            $post->delete();
        });

        return $this->successResponse(true, ['deleted' => $deleted->count()], 'Đã xóa ' . $deleted->count() . ' bài đăng.');
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
            'comments_count'  => $post->comments_count ?? 0,
            'reactions_count' => (int) ($post->reactions_count ?? 0),
            'channel'         => $post->channel ? [
                'id'   => $post->channel->id,
                'name' => $post->channel->name,
                'slug' => $post->channel->slug,
            ] : null,
            'tags'            => [],
            'media_urls'      => $post->media_urls ?? [],
            'created_at'      => $post->created_at?->toIso8601String(),
            'updated_at'      => $post->updated_at?->toIso8601String(),
            'deleted_at'      => $post->deleted_at?->toIso8601String(),
        ];
    }
}
