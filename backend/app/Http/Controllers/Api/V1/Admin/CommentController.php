<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Events\CommentVisibilityChanged;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'created_at', 'content', 'post_id', 'user_name', 'reactions_count', 'is_hidden'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $type    = $request->query('type');

        $visibility = $request->query('visibility');

        $comments = Comment::query()
            ->with('user:id,full_name,email,avatar,student_code', 'blog:id,slug')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('comments.content', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($type === 'post', fn ($q) => $q->whereNotNull('comments.post_id'))
            ->when($type === 'blog', fn ($q) => $q->whereNotNull('comments.blog_id'))
            ->when($visibility === 'visible', fn ($q) => $q->where('comments.is_hidden', false))
            ->when($visibility === 'hidden',  fn ($q) => $q->where('comments.is_hidden', true))
            ->when(in_array($sort, ['id', 'created_at', 'content', 'post_id']), fn ($q) => $q->orderBy("comments.{$sort}", $order))
            ->when($sort === 'user_name', fn ($q) => $q->orderByRaw("(SELECT COALESCE(full_name, email) FROM users WHERE users.id = comments.user_id) {$order}"))
            ->when($sort === 'reactions_count', fn ($q) => $q->orderByRaw("reactions_count {$order}"))
            ->when($sort === 'is_hidden', fn ($q) => $q->orderBy('comments.is_hidden', $order))
            ->paginate($perPage);

        $comments->getCollection()->transform(fn (Comment $comment) => $this->transformComment($comment));

        return $this->paginatedResponse($comments, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $base    = DB::table('comments')->whereNull('deleted_at');
        $total   = (clone $base)->count();
        $hidden  = (clone $base)->where('is_hidden', true)->count();
        $replies = (clone $base)->whereNotNull('parent_id')->count();

        return $this->successResponse(true, [
            'total'   => $total,
            'visible' => $total - $hidden,
            'hidden'  => $hidden,
            'replies' => $replies,
        ], ApiMessage::RETRIEVED);
    }

    public function updateVisibility(Request $request, Comment $comment): JsonResponse
    {
        $request->validate(['is_hidden' => 'required|boolean']);

        $comment->update(['is_hidden' => $request->boolean('is_hidden')]);

        if ($comment->post_id) {
            // Broadcast to all clients viewing this post
            broadcast(new CommentVisibilityChanged(
                commentId: $comment->id,
                postId:    $comment->post_id,
                isHidden:  $comment->is_hidden,
            ))->toOthers();
        }

        return $this->successResponse(true, ['is_hidden' => $comment->is_hidden], 'Cập nhật trạng thái bình luận thành công.');
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $comment->delete();

        return $this->successResponse(true, null, 'Xóa bình luận thành công.');
    }

    private function transformComment(Comment $comment): array
    {
        $user = $comment->user;
        $commentableType = $comment->blog_id ? 'blog' : 'post';
        $commentableId   = $comment->blog_id ?? $comment->post_id;

        return [
            'id'               => $comment->id,
            'user'             => $user ? [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'avatar'       => $user->avatar,
                'student_code' => $user->student_code,
            ] : null,
            'commentable_type' => $commentableType,
            'commentable_id'   => $commentableId,
            'article_url'      => $this->articleUrl($comment),
            'parent_id'        => $comment->parent_id,
            'content'          => $comment->content,
            'is_hidden'        => (bool) $comment->is_hidden,
            'moderation_reason' => $comment->moderation_reason,
            'moderated_at'     => $comment->moderated_at?->toIso8601String(),
            'reactions_count'  => (int) ($comment->reactions_count ?? 0),
            'created_at'       => $comment->created_at?->toIso8601String(),
            'updated_at'       => $comment->updated_at?->toIso8601String(),
        ];
    }

    private function articleUrl(Comment $comment): ?string
    {
        $frontendUrl = rtrim((string) env('USER_FRONTEND_URL', 'http://localhost:5174'), '/');

        if ($comment->blog_id && $comment->blog?->slug) {
            return "{$frontendUrl}/blog/{$comment->blog->slug}";
        }

        if ($comment->post_id) {
            return "{$frontendUrl}/cong-dong/bai-viet/{$comment->post_id}";
        }

        return null;
    }
}
