<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Blog;
use App\Models\MediaFile;
use App\Models\Comment;
use App\Models\Reaction;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BlogController extends BaseApiController
{
    public function tags(): JsonResponse
    {
        $tags = Tag::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Tag $tag) => [
                'id'    => $tag->id,
                'name'  => $tag->name,
                'color' => null,
            ])
            ->values()
            ->toArray();

        return $this->successResponse(true, $tags, ApiMessage::RETRIEVED);
    }

    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['published_at', 'reactions_count', 'view_count', 'created_at'];
        $sort    = in_array($request->query('sort', 'published_at'), $allowedSorts)
            ? $request->query('sort', 'published_at')
            : 'published_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';
        $perPage = min((int) $request->query('per_page', 12), 50);
        $search  = $request->query('search');
        $tag     = $request->query('tag');
        $username = $request->query('username');

        $blogs = Blog::query()
            ->with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->where('blogs.status', 'published')
            ->when($search, fn ($q) => $q->where('blogs.title', 'like', "%{$search}%"))
            ->when($tag, fn ($q) => $q->whereHas('tags', fn ($t) => $t->where('name', $tag)))
            ->when($username, fn ($q) => $q->whereHas('author', fn ($author) => $author
                ->where('username', $username)
                ->orWhere('email', 'like', "{$username}@%")
            ))
            ->when(
                $sort === 'reactions_count',
                fn ($q) => $q->orderBy('reactions_count', $order),
                fn ($q) => $q->orderBy("blogs.{$sort}", $order)
            )
            ->paginate($perPage);

        $userId = auth('sanctum')->id();
        $myReactions = [];
        if ($userId) {
            $blogIds = $blogs->pluck('id')->toArray();
            $myReactions = Reaction::where('user_id', $userId)
                ->where('target_type', 'blog')
                ->whereIn('target_id', $blogIds)
                ->pluck('type', 'target_id')
                ->toArray();
        }

        $blogs->getCollection()->transform(function (Blog $blog) use ($myReactions) {
            $data = $this->transformBlog($blog);
            $data['my_reaction'] = $myReactions[$blog->id] ?? null;
            return $data;
        });

        return $this->paginatedResponse($blogs, ApiMessage::RETRIEVED);
    }

    public function show(string $slug): JsonResponse
    {
        $blog = Blog::with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count,
                         (SELECT COUNT(*) FROM comments WHERE blog_id = blogs.id AND deleted_at IS NULL AND is_hidden = 0) as blog_comments_count')
            ->where('status', 'published')
            ->where(fn ($q) => $q
                ->where('slug', $slug)
                ->orWhere('id', is_numeric($slug) ? (int) $slug : 0)
            )
            ->firstOrFail();

        $blog->increment('view_count');

        $data = $this->transformBlog($blog);
        $data['content']        = $blog->content;
        $data['comments_count'] = (int) ($blog->blog_comments_count ?? 0);

        $data['reaction_summary'] = Reaction::where('target_type', 'blog')
            ->where('target_id', $blog->id)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $userId = auth('sanctum')->id();
        $data['my_reaction'] = $userId
            ? Reaction::where('user_id', $userId)
                ->where('target_type', 'blog')
                ->where('target_id', $blog->id)
                ->value('type')
            : null;

        if ($data['user'] && $userId && $blog->author) {
            $data['user']['is_following'] = auth('sanctum')->user()
                ->following()
                ->where('following_id', $blog->author->id)
                ->exists();
        }

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'          => ['required', 'string', 'min:5', 'max:500'],
            'slug'           => ['nullable', 'string', 'max:500'],
            'content'        => ['required', 'string'],
            'excerpt'        => ['nullable', 'string', 'max:1000'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'tag_ids'        => ['nullable', 'array'],
            'tag_ids.*'      => ['integer', 'exists:tags,id'],
        ]);

        $coverImagePath = null;
        if ($request->hasFile('featured_image')) {
            $coverImagePath = $request->file('featured_image')->store('blog-covers', 'public');
        }

        $baseSlug = Str::slug($request->input('slug') ?: $request->input('title')) ?: 'blog';
        $slug = $baseSlug;
        $i = 1;
        while (Blog::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$i}";
            $i++;
        }

        $isAdmin = $request->user()->hasRole(RolesEnum::adminRoles());

        $blog = DB::transaction(function () use ($request, $slug, $coverImagePath, $isAdmin) {
            $blog = Blog::create([
                'author_id'    => $request->user()->id,
                'title'        => $request->input('title'),
                'slug'         => $slug,
                'content'      => $request->input('content'),
                'excerpt'      => $request->input('excerpt'),
                'cover_image'  => $coverImagePath,
                'status'       => $isAdmin ? 'published' : 'pending_review',
                'published_at' => $isAdmin ? now() : null,
                'view_count'   => 0,
            ]);

            if ($request->filled('tag_ids')) {
                $blog->tags()->sync($request->input('tag_ids'));
            }

            return $blog;
        });

        $blog->load(['author:id,full_name,email,avatar,username', 'tags:id,name']);

        // Track ảnh bìa vào media_files nếu có
        if ($coverImagePath) {
            MediaFile::create([
                'owner_id'    => $request->user()->id,
                'url'         => Storage::disk('public')->url($coverImagePath),
                'file_type'   => 'image',
                'size_kb'     => (int) ceil($request->file('featured_image')->getSize() / 1024),
                'target_type' => 'blog',
                'target_id'   => $blog->id,
            ]);
        }

        $message = $isAdmin ? 'Tạo blog thành công.' : 'Blog đã được gửi và đang chờ duyệt.';

        return $this->createdResponse($this->transformBlog($blog), $message);
    }

    public function react(Request $request, int $id): JsonResponse
    {
        $request->validate(['type' => 'required|in:heart,like,haha,wow,sad']);

        Blog::where('status', 'published')->findOrFail($id);

        $userId = $request->user()->id;
        $type   = $request->input('type');

        $existing = Reaction::where('user_id', $userId)
            ->where('target_type', 'blog')
            ->where('target_id', $id)
            ->first();

        $reacted    = false;
        $myReaction = null;

        if ($existing) {
            if ($existing->type === $type) {
                $existing->delete();
            } else {
                $existing->type = $type;
                $existing->save();
                $reacted    = true;
                $myReaction = $type;
            }
        } else {
            Reaction::create([
                'user_id'     => $userId,
                'target_type' => 'blog',
                'target_id'   => $id,
                'type'        => $type,
            ]);
            $reacted    = true;
            $myReaction = $type;
        }

        $summary = Reaction::where('target_type', 'blog')
            ->where('target_id', $id)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        return $this->successResponse(true, [
            'reacted'          => $reacted,
            'my_reaction'      => $myReaction,
            'reactions_count'  => (int) $summary->sum(),
            'reaction_summary' => $summary,
        ], ApiMessage::UPDATED);
    }

    public function comments(int $id): JsonResponse
    {
        Blog::where('status', 'published')->findOrFail($id);

        $allComments = Comment::with('user:id,full_name,username,email,avatar')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count')
            ->where('blog_id', $id)
            ->where('is_hidden', false)
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'asc')
            ->get();

        $repliesByParent = $allComments
            ->filter(fn ($c) => $c->parent_id !== null)
            ->groupBy('parent_id');

        $topLevel = $allComments
            ->filter(fn ($c) => $c->parent_id === null)
            ->map(fn (Comment $comment) => array_merge(
                $this->transformComment($comment),
                [
                    'replies' => ($repliesByParent->get($comment->id) ?? collect())
                        ->map(fn (Comment $r) => $this->transformComment($r))
                        ->values()
                        ->toArray(),
                ]
            ))
            ->values()
            ->toArray();

        return $this->successResponse(true, $topLevel, ApiMessage::RETRIEVED);
    }

    public function comment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'content'   => ['required', 'string', 'min:1', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        Blog::where('status', 'published')->findOrFail($id);

        $parentId = $request->input('parent_id');
        $depth    = 0;

        if ($parentId) {
            $parent = Comment::findOrFail($parentId);
            abort_if((int) $parent->blog_id !== $id, 422, 'Parent comment not found on this blog');
            $depth = 1;
        }

        $comment = Comment::create([
            'blog_id'   => $id,
            'post_id'   => null,
            'user_id'   => $request->user()->id,
            'content'   => $request->input('content'),
            'parent_id' => $parentId,
            'depth'     => $depth,
        ]);

        $comment->load('user:id,full_name,username,email,avatar');

        return $this->createdResponse($this->transformComment($comment));
    }

    private function transformBlog(Blog $blog): array
    {
        $author = $blog->author;

        return [
            'id'              => $blog->id,
            'slug'            => $blog->slug,
            'user'            => $author ? [
                'id'        => $author->id,
                'full_name' => $author->full_name,
                'email'     => $author->email,
                'avatar'    => $author->avatar,
                'username'  => $author->username,
            ] : null,
            'title'           => $blog->title,
            'excerpt'         => $blog->excerpt,
            'featured_image'  => $blog->cover_image
                ? Storage::disk('public')->url($blog->cover_image)
                : null,
            'status'          => $blog->status,
            'published_at'    => $blog->published_at?->toIso8601String(),
            'view_count'      => (int) $blog->view_count,
            'comments_count'  => 0,
            'reactions_count' => (int) ($blog->reactions_count ?? 0),
            'my_reaction'     => null,
            'tags'            => $blog->tags->map(fn ($tag) => [
                'id'    => $tag->id,
                'name'  => $tag->name,
                'color' => null,
            ])->values()->toArray(),
            'created_at'      => $blog->created_at?->toIso8601String(),
            'updated_at'      => $blog->updated_at?->toIso8601String(),
        ];
    }

    private function transformComment(Comment $comment): array
    {
        $user = $comment->user;
        return [
            'id'              => $comment->id,
            'parent_id'       => $comment->parent_id,
            'user'            => $user ? [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'username'  => $user->username,
                'email'     => $user->email,
                'avatar'    => $user->avatar,
            ] : null,
            'content'         => $comment->content,
            'reactions_count' => (int) ($comment->reactions_count ?? 0),
            'created_at'      => $comment->created_at?->toIso8601String(),
        ];
    }
}
