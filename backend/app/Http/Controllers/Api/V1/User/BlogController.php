<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Blog;
use App\Models\MediaFile;
use App\Models\Comment;
use App\Models\Reaction;
use App\Models\Tag;
use App\Services\NotificationService;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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

        $viewer = auth('sanctum')->user();

        $blogs = Blog::query()
            ->with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->where('blogs.status', 'published')
            ->visibleTo($viewer)
            ->when($search, fn ($q) => $q->where('blogs.title', 'like', "%{$search}%"))
            ->when($tag, fn ($q) => $q->whereHas('tags', fn ($t) => $t->where('name', $tag)))
            ->when($username, fn ($q) => $q->whereHas('author', fn ($author) => $author
                ->where('username', $username)
                ->orWhere('email', 'like', "{$username}@%")
            ))
            ->when($username, fn ($q) => $q->orderByDesc('blogs.is_pinned')->orderByDesc('blogs.pinned_at'))
            ->when(!$search && !$tag && !$username, fn ($q) => $q->orderByDesc('blogs.is_highlight'))
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
        $authUserId = auth('sanctum')->id();
        $viewer     = auth('sanctum')->user();

        $blog = Blog::with([
                'author' => fn ($q) => $q->select('id', 'full_name', 'email', 'avatar', 'username')->with('roles:id,name'),
                'tags:id,name',
            ])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count,
                         (SELECT COUNT(*) FROM comments WHERE blog_id = blogs.id AND deleted_at IS NULL AND is_hidden = 0) as blog_comments_count')
            ->where(fn ($q) => $q
                ->where('slug', $slug)
                ->orWhere('id', is_numeric($slug) ? (int) $slug : 0)
            )
            // Cho phép tác giả xem blog của chính mình dù chưa published
            ->where(fn ($q) => $q
                ->where('status', 'published')
                ->orWhere(fn ($inner) => $inner
                    ->where('author_id', $authUserId ?? 0)
                    ->whereIn('status', ['draft', 'pending_review', 'archived'])
                )
            )
            ->firstOrFail();

        // Kiểm tra quyền xem theo visibility (chỉ áp dụng cho blog published)
        if ($blog->status === 'published' && ! $blog->isVisibleTo($viewer)) {
            abort(403, 'Bạn không có quyền xem bài viết này.');
        }


        $data = $this->transformBlog($blog);
        if ($data['user'] && $blog->author) {
            $data['user']['role'] = $blog->author->getRoleNames()->first();
        }
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

        $data['my_bookmark'] = $userId
            ? DB::table('blog_bookmarks')
                ->where('user_id', $userId)
                ->where('blog_id', $blog->id)
                ->exists()
            : false;

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
            'status'         => ['nullable', 'in:draft,pending_review'],
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

        // Admin always publishes; user chooses draft or pending_review (default: pending_review)
        $status = $isAdmin
            ? 'published'
            : ($request->input('status', 'pending_review') === 'draft' ? 'draft' : 'pending_review');

        $blog = DB::transaction(function () use ($request, $slug, $coverImagePath, $status) {
            $blog = Blog::create([
                'author_id'    => $request->user()->id,
                'title'        => $request->input('title'),
                'slug'         => $slug,
                'content'      => $request->input('content'),
                'excerpt'      => $request->input('excerpt'),
                'cover_image'  => $coverImagePath,
                'status'       => $status,
                'published_at' => $status === 'published' ? now() : null,
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

        $messages = [
            'published'      => 'Tạo blog thành công.',
            'pending_review' => 'Blog đã được gửi và đang chờ duyệt.',
            'draft'          => 'Đã lưu nháp.',
        ];

        return $this->createdResponse($this->transformBlog($blog), $messages[$status] ?? 'Tạo blog thành công.');
    }

    public function myDraftBlogs(Request $request): JsonResponse
    {
        $userId  = $request->user()->id;
        $perPage = min((int) $request->query('per_page', 20), 50);

        $blogs = Blog::with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->where('author_id', $userId)
            ->whereIn('status', ['draft', 'pending_review'])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage);

        $blogs->getCollection()->transform(fn (Blog $blog) => [
            ...$this->transformBlog($blog),
            'my_reaction' => null,
            'my_bookmark' => false,
        ]);

        return $this->paginatedResponse($blogs, ApiMessage::RETRIEVED);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $userId = $request->user()->id;

        $blog = Blog::where(fn ($q) => $q->where('slug', $slug)->orWhere('id', is_numeric($slug) ? (int)$slug : 0))
            ->where('author_id', $userId)
            ->whereIn('status', ['draft', 'pending_review', 'published', 'archived'])
            ->firstOrFail();

        $request->validate([
            'title'          => ['sometimes', 'required', 'string', 'min:5', 'max:500'],
            'content'        => ['sometimes', 'required', 'string'],
            'excerpt'        => ['nullable', 'string', 'max:1000'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'tag_ids'        => ['nullable', 'array'],
            'tag_ids.*'      => ['integer', 'exists:tags,id'],
            'status'         => ['nullable', 'in:draft,pending_review'],
        ]);

        if ($request->filled('title') && $request->input('title') !== $blog->title) {
            $baseSlug = Str::slug($request->input('title')) ?: 'blog';
            $newSlug  = $baseSlug;
            $i        = 1;
            while (Blog::where('slug', $newSlug)->where('id', '!=', $blog->id)->exists()) {
                $newSlug = "{$baseSlug}-{$i}";
                $i++;
            }
            $blog->slug  = $newSlug;
            $blog->title = $request->input('title');
        }

        if ($request->has('content'))  $blog->content  = $request->input('content');
        if ($request->has('excerpt'))  $blog->excerpt  = $request->input('excerpt');

        // Xác định status sau khi cập nhật:
        // - Admin → giữ published (hoặc theo request nếu đang là draft/pending_review)
        // - User thường → pending_review khi đăng lại (kể cả blog đã published/archived)
        $isAdmin = $request->user()->hasRole(RolesEnum::adminRoles());
        if ($request->has('status')) {
            $blog->status = $isAdmin ? 'published' : $request->input('status');
        } elseif (!$isAdmin && in_array($blog->status, ['published', 'archived'])) {
            $blog->status = 'pending_review';
        }

        if ($request->hasFile('featured_image')) {
            // Xóa ảnh cũ nếu có
            if ($blog->cover_image) {
                Storage::disk('public')->delete($blog->cover_image);
            }
            $blog->cover_image = $request->file('featured_image')->store('blog-covers', 'public');
        }

        $blog->save();

        if ($request->has('tag_ids')) {
            $blog->tags()->sync($request->input('tag_ids', []));
        }

        $blog->load(['author:id,full_name,email,avatar,username', 'tags:id,name']);

        $messages = [
            'published'      => 'Blog đã được cập nhật và xuất bản.',
            'pending_review' => 'Blog đã được gửi và đang chờ duyệt.',
            'draft'          => 'Đã lưu nháp.',
        ];

        return $this->successResponse(true, $this->transformBlog($blog), $messages[$blog->status] ?? 'Cập nhật blog thành công.', HttpStatus::OK);
    }

    public function pin(Request $request, int $id): JsonResponse
    {
        $blog = Blog::where('author_id', $request->user()->id)->find($id);
        if (! $blog) {
            abort(403, 'Bạn không có quyền thực hiện hành động này.');
        }

        $pinning = (bool) $request->input('is_pinned', true);

        if ($pinning && ! $blog->is_pinned) {
            $pinnedCount = Blog::where('author_id', $request->user()->id)
                ->where('is_pinned', true)
                ->count();
            if ($pinnedCount >= 3) {
                return $this->errorResponse(false, 'Bạn chỉ có thể ghim tối đa 3 blog.', 422);
            }
        }

        $blog->update([
            'is_pinned' => $pinning,
            'pinned_at' => $pinning ? now() : null,
        ]);

        return $this->successResponse(true, ['is_pinned' => $blog->is_pinned], 'Cập nhật trạng thái ghim thành công.');
    }

    public function bookmarks(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 50);
        $userId  = $request->user()->id;

        $blogs = Blog::with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->where('blogs.status', 'published')
            ->whereExists(fn ($q) => $q->from('blog_bookmarks')
                ->whereColumn('blog_bookmarks.blog_id', 'blogs.id')
                ->where('blog_bookmarks.user_id', $userId)
            )
            ->orderBy('blogs.created_at', 'desc')
            ->paginate($perPage);

        $blogs->getCollection()->transform(fn (Blog $blog) => [
            ...$this->transformBlog($blog),
            'my_reaction' => null,
            'my_bookmark' => true,
        ]);

        return $this->paginatedResponse($blogs, ApiMessage::RETRIEVED);
    }

    public function archived(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 50);
        $userId  = $request->user()->id;

        $blogs = Blog::with(['author:id,full_name,email,avatar,username', 'tags:id,name'])
            ->selectRaw('blogs.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "blog" AND target_id = blogs.id) as reactions_count')
            ->where('blogs.author_id', $userId)
            ->where('blogs.status', 'archived')
            ->orderBy('blogs.created_at', 'desc')
            ->paginate($perPage);

        $blogs->getCollection()->transform(fn (Blog $blog) => [
            ...$this->transformBlog($blog),
            'my_reaction' => null,
            'my_bookmark' => false,
        ]);

        return $this->paginatedResponse($blogs, ApiMessage::RETRIEVED);
    }

    public function bookmark(Request $request, int $id): JsonResponse
    {
        Blog::where('status', 'published')->findOrFail($id);

        $userId = $request->user()->id;
        $exists = DB::table('blog_bookmarks')
            ->where('user_id', $userId)
            ->where('blog_id', $id)
            ->exists();

        if ($exists) {
            DB::table('blog_bookmarks')
                ->where('user_id', $userId)
                ->where('blog_id', $id)
                ->delete();
            $bookmarked = false;
        } else {
            DB::table('blog_bookmarks')->insert([
                'user_id'    => $userId,
                'blog_id'    => $id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $bookmarked = true;
        }

        return $this->successResponse(true, [
            'bookmarked' => $bookmarked,
        ], $bookmarked ? 'Đã lưu blog.' : 'Đã bỏ lưu blog.');
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

    /**
     * List users who reacted to a blog (public).
     * Returns each reactor with their follow status for the authenticated viewer.
     */
    public function reactors(Request $request, int $id): JsonResponse
    {
        $viewer = $request->user('sanctum');

        Blog::query()
            ->where('status', 'published')
            ->visibleTo($viewer)
            ->findOrFail($id);

        $reactorUsers = Reaction::where('target_type', 'blog')
            ->where('target_id', $id)
            ->with('user:id,full_name,username,email,avatar')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($reaction) => $reaction->user)
            ->filter()
            ->unique('id')
            ->values();

        $followingIds = $viewer
            ? DB::table('user_follows')->where('follower_id', $viewer->id)->pluck('following_id')->all()
            : [];

        $data = $reactorUsers->map(fn ($user) => [
            'id'           => $user->id,
            'full_name'    => $user->full_name,
            'username'     => $user->username,
            'email'        => $user->email,
            'avatar'       => $user->avatar,
            'is_following' => in_array($user->id, $followingIds),
        ]);

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    public function comments(int $id): JsonResponse
    {
        Blog::where('status', 'published')->findOrFail($id);

        $userId = auth('sanctum')->id();

        $allComments = Comment::with('user:id,full_name,username,email,avatar')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count')
            ->where('blog_id', $id)
            ->where('is_hidden', false)
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'asc')
            ->get();

        $myReactions = [];
        if ($userId) {
            $commentIds  = $allComments->pluck('id')->toArray();
            $myReactions = Reaction::where('user_id', $userId)
                ->where('target_type', 'comment')
                ->whereIn('target_id', $commentIds)
                ->pluck('type', 'target_id')
                ->toArray();
        }

        $repliesByParent = $allComments
            ->filter(fn ($c) => $c->parent_id !== null)
            ->groupBy('parent_id');

        $topLevel = $allComments
            ->filter(fn ($c) => $c->parent_id === null)
            ->map(fn (Comment $comment) => array_merge(
                $this->transformComment($comment, $myReactions),
                [
                    'replies' => ($repliesByParent->get($comment->id) ?? collect())
                        ->map(fn (Comment $r) => $this->transformComment($r, $myReactions))
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

        if ($parentId) {
            // Reply: notify the parent comment author
            $parent->load('user:id,full_name,avatar,username');
            if ($parent->user) {
                $blog = Blog::find($id);
                UserNotificationService::dispatchBlogCommentReply(
                    $parent->user, $request->user(), $comment->id, $blog, $comment->content,
                );
            }
        } else {
            // Top-level comment: notify the blog author
            $blog = Blog::with('author:id,full_name,avatar,username')->find($id);
            if ($blog?->author) {
                UserNotificationService::dispatchBlogComment($blog->author, $request->user(), $blog, $comment->content, $comment->id);
            }
        }

        return $this->createdResponse($this->transformComment($comment));
    }

    public function updateVisibility(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'visibility' => ['required', 'in:public,members,private'],
        ]);

        $blog = Blog::where('author_id', $request->user()->id)->findOrFail($id);
        $blog->update(['visibility' => $request->input('visibility')]);

        return $this->successResponse(
            true,
            ['visibility' => $blog->visibility],
            'Đã cập nhật quyền riêng tư.'
        );
    }

    public function archive(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:published,archived'],
        ]);

        $blog = Blog::where('author_id', $request->user()->id)->findOrFail($id);

        $blog->update(['status' => $request->input('status')]);

        return $this->successResponse(
            true,
            ['status' => $blog->status],
            $blog->status === 'archived' ? 'Đã lưu trữ blog.' : 'Đã khôi phục blog.'
        );
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $blog = Blog::where('author_id', $request->user()->id)->findOrFail($id);
        $blog->delete();

        return $this->successResponse(true, null, 'Đã xóa blog.');
    }

    public function report(Request $request, int $id): JsonResponse
    {
        $blog = Blog::query()
            ->where('status', 'published')
            ->findOrFail($id);

        if ($blog->author_id === $request->user()->id) {
            abort(403, 'Bạn không thể báo cáo blog của chính mình.');
        }

        $validated = $request->validate([
            'reason'      => ['required', Rule::in(['spam', 'offensive', 'misinformation', 'inappropriate', 'other'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $alreadyReported = DB::table('blog_reports')
            ->where('blog_id', $id)
            ->where('reporter_id', $request->user()->id)
            ->exists();

        if (! $alreadyReported) {
            DB::table('blog_reports')->insert([
                'blog_id'     => $id,
                'reporter_id' => $request->user()->id,
                'reason'      => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status'      => 'pending',
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            // Notify all admins about the new report
            $reporter = $request->user();
            NotificationService::dispatch(
                title: 'Báo cáo vi phạm mới',
                message: "{$reporter->full_name} đã báo cáo blog \"{$blog->title}\".",
                action: 'created',
                entityType: 'blog_report',
                entityId: $id,
                performedBy: $reporter->full_name,
                link: '/community/reports',
            );
        }

        return $this->successResponse(true, [], 'Báo cáo đã được ghi nhận.');
    }

    public function recordView(string $slug): JsonResponse
    {
        $authUserId = auth('sanctum')->id();

        $blog = Blog::where('status', 'published')
            ->where(fn ($q) => $q
                ->where('slug', $slug)
                ->orWhere('id', is_numeric($slug) ? (int) $slug : 0)
            )
            ->firstOrFail();

        // Tác giả không tự tăng lượt xem bài của mình
        if ((int) $blog->author_id !== (int) $authUserId) {
            $blog->increment('view_count');
        }

        return $this->successResponse(true, ['view_count' => $blog->view_count], ApiMessage::UPDATED);
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
            'featured_image'  => $this->coverImageUrl($blog->cover_image),
            'status'          => $blog->status,
            'visibility'      => $blog->visibility ?? 'public',
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
            'is_pinned'       => (bool) $blog->is_pinned,
            'is_highlight'    => (bool) $blog->is_highlight,
            'created_at'      => $blog->created_at?->toIso8601String(),
            'updated_at'      => $blog->updated_at?->toIso8601String(),
        ];
    }

    private function coverImageUrl(?string $coverImage): ?string
    {
        if (! $coverImage) {
            return null;
        }

        if (Str::startsWith($coverImage, ['http://', 'https://', '/assets/', '/storage/'])) {
            return $coverImage;
        }

        return Storage::disk('public')->url($coverImage);
    }

    private function transformComment(Comment $comment, array $myReactions = []): array
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
            'my_reaction'     => $myReactions[$comment->id] ?? null,
            'created_at'      => $comment->created_at?->toIso8601String(),
        ];
    }
}
