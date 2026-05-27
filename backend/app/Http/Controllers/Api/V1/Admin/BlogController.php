<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BlogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'title', 'status', 'view_count', 'published_at', 'created_at'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search  = $request->query('search');
        $status  = $request->query('status');

        $blogs = Blog::query()
            ->with([
                'author:id,full_name,email,avatar',
                'tags:id,name',
            ])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('blogs.title', 'like', "%{$search}%")
                ->orWhereHas('author', fn ($u) => $u->where('full_name', 'like', "%{$search}%"))
            ))
            ->when($status && $status !== 'all', fn ($q) => $q->where('blogs.status', $status))
            ->orderBy("blogs.{$sort}", $order)
            ->paginate($perPage);

        $blogs->getCollection()->transform(fn (Blog $blog) => $this->transformBlog($blog));

        return $this->paginatedResponse($blogs, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $counts = DB::table('blogs')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse(true, [
            'total'          => $counts->sum(),
            'published'      => (int) ($counts['published'] ?? 0),
            'draft'          => (int) ($counts['draft'] ?? 0),
            'archived'       => (int) ($counts['archived'] ?? 0),
            'pending_review' => (int) ($counts['pending_review'] ?? 0),
        ], ApiMessage::RETRIEVED);
    }

    public function updateStatus(Request $request, Blog $blog): JsonResponse
    {
        $request->validate(['status' => 'required|in:draft,pending_review,published,archived']);

        $status = $request->string('status')->value();
        $blog->update([
            'status'       => $status,
            'published_at' => $status === 'published' && ! $blog->published_at ? now() : $blog->published_at,
        ]);

        return $this->successResponse(true, ['status' => $blog->status], 'Cập nhật trạng thái blog thành công.');
    }

    public function destroy(Blog $blog): JsonResponse
    {
        $blog->delete();

        return $this->successResponse(true, null, 'Xóa blog thành công.');
    }

    private function transformBlog(Blog $blog): array
    {
        $author = $blog->author;

        return [
            'id'              => $blog->id,
            'user'            => $author ? [
                'id'        => $author->id,
                'full_name' => $author->full_name,
                'email'     => $author->email,
                'avatar'    => $author->avatar,
            ] : null,
            'title'           => $blog->title,
            'slug'            => $blog->slug,
            'excerpt'         => $blog->excerpt,
            'featured_image'  => $blog->cover_image,
            'status'          => $blog->status,
            'published_at'    => $blog->published_at?->toIso8601String(),
            'view_count'      => (int) $blog->view_count,
            'comments_count'  => 0,
            'reactions_count' => (int) ($blog->reactions_count ?? 0),
            'tags'            => $blog->tags->map(fn ($tag) => [
                'id'    => $tag->id,
                'name'  => $tag->name,
                'color' => null,
            ])->values()->toArray(),
            'created_at'      => $blog->created_at?->toIso8601String(),
            'updated_at'      => $blog->updated_at?->toIso8601String(),
        ];
    }
}
