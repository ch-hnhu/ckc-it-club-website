<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $type    = $request->query('type');

        $comments = Comment::query()
            ->with('user:id,full_name,email,avatar,student_code')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('comments.content', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($type === 'blog', fn ($q) => $q->whereRaw('0 = 1'))
            ->orderBy("comments.{$sort}", $order)
            ->paginate($perPage);

        $comments->getCollection()->transform(fn (Comment $comment) => $this->transformComment($comment));

        return $this->paginatedResponse($comments, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $total   = DB::table('comments')->whereNull('deleted_at')->count();
        $replies = DB::table('comments')->whereNull('deleted_at')->whereNotNull('parent_id')->count();

        return $this->successResponse(true, [
            'total'   => $total,
            'visible' => $total,
            'hidden'  => 0,
            'replies' => $replies,
        ], ApiMessage::RETRIEVED);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $comment->delete();

        return $this->successResponse(true, null, 'Xóa bình luận thành công.');
    }

    private function transformComment(Comment $comment): array
    {
        $user = $comment->user;

        return [
            'id'               => $comment->id,
            'user'             => $user ? [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'avatar'       => $user->avatar,
                'student_code' => $user->student_code,
            ] : null,
            'commentable_type' => 'post',
            'commentable_id'   => $comment->post_id,
            'parent_id'        => $comment->parent_id,
            'content'          => $comment->content,
            'is_hidden'        => false,
            'reactions_count'  => (int) ($comment->reactions_count ?? 0),
            'created_at'       => $comment->created_at?->toIso8601String(),
            'updated_at'       => $comment->updated_at?->toIso8601String(),
        ];
    }
}
