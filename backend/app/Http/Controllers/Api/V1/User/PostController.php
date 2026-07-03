<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\ReactionType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Channel;
use App\Models\Comment;
use App\Models\MediaFile;
use App\Models\Post;
use App\Jobs\ModerateCommentJob;
use App\Models\Reaction;
use App\Services\NotificationService;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['created_at', 'reactions_count'];
        $sort = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';
        $perPage = min((int) $request->query('per_page', 15), 50);
        $channel = $request->query('channel');
        $username = $request->query('username');

        $viewer = $request->user('sanctum');

        $posts = Post::query()
            ->with([
                'user:id,full_name,username,email,avatar,student_code',
                'channel:id,name,slug',
            ])
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->where('posts.status', 'published')
            ->visibleTo($viewer)
            ->when(
                $channel && $channel !== 'all',
                fn ($q) => $q->whereHas('channel', fn ($c) => $c->where('slug', $channel))
            )
            ->when(
                $username,
                fn ($q) => $q->whereHas('user', fn ($u) => $u
                    ->where('username', $username)
                    ->orWhere('email', 'like', "{$username}@%"))
            )
            ->when(
                $username,
                fn ($q) => $q->orderByDesc('posts.is_pinned')->orderByDesc('posts.pinned_at')
            )
            ->orderBy(
                $sort === 'reactions_count' ? 'reactions_count' : "posts.{$sort}",
                $order
            )
            ->paginate($perPage);

        // Optionally enrich with current user's reactions and bookmarks (batch queries)
        $userId = $viewer?->id;
        $myReactions = [];
        $myBookmarks = [];
        $myReports = [];
        if ($userId) {
            $postIds = $posts->pluck('id')->toArray();
            $myReactions = Reaction::where('user_id', $userId)
                ->where('target_type', 'post')
                ->whereIn('target_id', $postIds)
                ->pluck('type', 'target_id')
                ->toArray();
            $myBookmarks = array_flip(
                DB::table('post_bookmarks')
                    ->where('user_id', $userId)
                    ->whereIn('post_id', $postIds)
                    ->pluck('post_id')
                    ->all()
            );
            $myReports = array_flip(
                DB::table('post_reports')
                    ->where('reporter_id', $userId)
                    ->whereIn('post_id', $postIds)
                    ->pluck('post_id')
                    ->all()
            );
        }

        $posts->getCollection()->transform(function (Post $post) use ($myReactions, $myBookmarks, $myReports) {
            $data = $this->transformPost($post);
            $data['my_reaction'] = $myReactions[$post->id] ?? null;
            $data['my_bookmark'] = isset($myBookmarks[$post->id]);
            $data['my_report'] = isset($myReports[$post->id]);

            return $data;
        });

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function bookmarks(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $userId = $request->user()->id;

        $posts = Post::query()
            ->with([
                'user:id,full_name,username,email,avatar,student_code',
                'channel:id,name,slug',
            ])
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->where('posts.status', 'published')
            ->visibleTo($request->user())
            ->whereHas('bookmarkedBy', fn ($q) => $q->where('user_id', $userId))
            ->orderBy('posts.created_at', 'desc')
            ->paginate($perPage);

        $postIds = $posts->pluck('id')->toArray();
        $myReactions = Reaction::where('user_id', $userId)
            ->where('target_type', 'post')
            ->whereIn('target_id', $postIds)
            ->pluck('type', 'target_id')
            ->toArray();
        $myReports = array_flip(
            DB::table('post_reports')
                ->where('reporter_id', $userId)
                ->whereIn('post_id', $postIds)
                ->pluck('post_id')
                ->all()
        );

        $posts->getCollection()->transform(function (Post $post) use ($myReactions, $myReports) {
            $data = $this->transformPost($post);
            $data['my_reaction'] = $myReactions[$post->id] ?? null;
            $data['my_bookmark'] = true;
            $data['my_report'] = isset($myReports[$post->id]);

            return $data;
        });

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function bookmark(Request $request, int $id): JsonResponse
    {
        Post::query()
            ->where('status', 'published')
            ->visibleTo($request->user())
            ->findOrFail($id);

        $userId = $request->user()->id;
        $exists = DB::table('post_bookmarks')
            ->where('user_id', $userId)
            ->where('post_id', $id)
            ->exists();

        if ($exists) {
            DB::table('post_bookmarks')
                ->where('user_id', $userId)
                ->where('post_id', $id)
                ->delete();
            $bookmarked = false;
        } else {
            DB::table('post_bookmarks')->insert([
                'user_id' => $userId,
                'post_id' => $id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $bookmarked = true;
        }

        return $this->successResponse(true, ['bookmarked' => $bookmarked], ApiMessage::UPDATED);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel_id' => ['nullable', 'integer', 'exists:channels,id'],
            'channel_slug' => ['nullable', 'string', 'max:255', 'exists:channels,slug'],
            'title' => ['required', 'string', 'min:5', 'max:255'],
            'content' => ['required', 'string', 'min:1', 'max:50000'],
            'visibility' => ['nullable', Rule::in(['public', 'members', 'private'])],
            'media' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime', 'max:20480'],
        ]);

        if (! $request->filled('channel_id') && ! $request->filled('channel_slug')) {
            return $this->validationErrorResponse([
                'channel_slug' => ['Vui lòng chọn kênh đăng bài.'],
            ]);
        }

        $content = $this->sanitizePostContent($validated['content']);
        $plainContent = trim(strip_tags($content));
        if ($plainContent === '' && ! Str::contains($content, ['<img'])) {
            return $this->validationErrorResponse([
                'content' => ['Vui lòng nhập nội dung bài viết.'],
            ]);
        }

        $channel = Channel::query()
            ->when(
                $request->filled('channel_id'),
                fn ($q) => $q->whereKey($validated['channel_id']),
                fn ($q) => $q->where('slug', $validated['channel_slug'])
            )
            ->firstOrFail();

        $storedPath = null;

        try {
            $post = DB::transaction(function () use ($request, $validated, $channel, $content, &$storedPath) {
                $mediaUrls = [];

                $post = Post::create([
                    'user_id' => $request->user()->id,
                    'channel_id' => $channel->id,
                    'title' => trim($validated['title']),
                    'content' => $content,
                    'media_urls' => null,
                    'visibility' => $validated['visibility'] ?? 'public',
                    'status' => 'published',
                ]);

                if ($request->hasFile('media')) {
                    $file = $request->file('media');
                    $storedPath = $file->store("community/posts/{$post->id}", 'public');
                    $mediaUrl = Storage::disk('public')->url($storedPath);
                    $mediaUrls[] = $mediaUrl;

                    MediaFile::create([
                        'owner_id' => $request->user()->id,
                        'url' => $mediaUrl,
                        'file_type' => $this->detectMediaType($file->getMimeType()),
                        'size_kb' => (int) ceil($file->getSize() / 1024),
                        'target_type' => 'post',
                        'target_id' => $post->id,
                    ]);

                    $post->update(['media_urls' => $mediaUrls]);
                }

                return $post;
            });
        } catch (\Throwable $exception) {
            if ($storedPath) {
                Storage::disk('public')->delete($storedPath);
            }

            throw $exception;
        }

        $post->load([
            'user:id,full_name,username,email,avatar,student_code',
            'channel:id,name,slug',
        ])->loadCount('comments');
        $post->reactions_count = 0;

        $data = $this->transformPost($post);
        $data['content'] = $post->content;
        $data['my_reaction'] = null;

        return $this->createdResponse($data, 'Đăng bài viết thành công.');
    }

    public function archived(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $userId = $request->user()->id;

        $posts = Post::query()
            ->with([
                'user:id,full_name,username,email,avatar,student_code',
                'channel:id,name,slug',
            ])
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->where('user_id', $userId)
            ->where('status', 'archived')
            ->orderBy('posts.created_at', 'desc')
            ->paginate($perPage);

        $postIds = $posts->pluck('id')->toArray();
        $myReactions = Reaction::where('user_id', $userId)
            ->where('target_type', 'post')
            ->whereIn('target_id', $postIds)
            ->pluck('type', 'target_id')
            ->toArray();

        $posts->getCollection()->transform(function (Post $post) use ($myReactions) {
            $data = $this->transformPost($post);
            $data['my_reaction'] = $myReactions[$post->id] ?? null;
            $data['my_bookmark'] = false;

            return $data;
        });

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = Post::where('user_id', $request->user()->id)->find($id);
        if (! $post) {
            abort(403, 'Bạn không có quyền chỉnh sửa bài viết này.');
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'min:5', 'max:255'],
            'content' => ['sometimes', 'string', 'min:1', 'max:50000'],
            'channel_slug' => ['sometimes', 'nullable', 'string', 'max:255', 'exists:channels,slug'],
            'visibility' => ['sometimes', 'nullable', Rule::in(['public', 'members', 'private'])],
            'is_pinned' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['published', 'archived'])],
            'media' => ['sometimes', 'nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime', 'max:20480'],
        ]);

        $updates = [];

        if ($request->filled('title')) {
            $updates['title'] = trim($validated['title']);
        }

        if ($request->filled('content')) {
            $content = $this->sanitizePostContent($validated['content']);
            $updates['content'] = $content;
        }

        if ($request->filled('channel_slug')) {
            $channel = Channel::where('slug', $validated['channel_slug'])->firstOrFail();
            $updates['channel_id'] = $channel->id;
        }

        if ($request->has('visibility')) {
            $updates['visibility'] = $validated['visibility'] ?? 'public';
        }

        if ($request->has('is_pinned')) {
            $pinning = (bool) $validated['is_pinned'];
            if ($pinning && ! $post->is_pinned) {
                $pinnedCount = Post::where('user_id', $request->user()->id)
                    ->where('is_pinned', true)
                    ->count();
                if ($pinnedCount >= 3) {
                    return $this->errorResponse(false, 'Bạn chỉ có thể ghim tối đa 3 bài viết.', 422);
                }
            }
            $updates['is_pinned'] = $pinning;
            $updates['pinned_at'] = $pinning ? now() : null;
        }

        if ($request->has('status')) {
            $updates['status'] = $validated['status'];
        }

        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $storedPath = $file->store("community/posts/{$post->id}", 'public');
            $mediaUrl = Storage::disk('public')->url($storedPath);

            MediaFile::create([
                'owner_id' => $request->user()->id,
                'url' => $mediaUrl,
                'file_type' => $this->detectMediaType($file->getMimeType()),
                'size_kb' => (int) ceil($file->getSize() / 1024),
                'target_type' => 'post',
                'target_id' => $post->id,
            ]);

            $updates['media_urls'] = [$mediaUrl];
        }

        if (! empty($updates)) {
            $post->update($updates);
        }

        $post->load([
            'user:id,full_name,username,email,avatar,student_code',
            'channel:id,name,slug',
        ])->loadCount('comments');
        $post->reactions_count = $post->reactions_count ?? 0;

        $data = $this->transformPost($post);
        $data['my_reaction'] = null;
        $data['my_bookmark'] = false;

        return $this->successResponse(true, $data, ApiMessage::UPDATED);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = Post::where('user_id', $request->user()->id)->find($id);
        if (! $post) {
            abort(403, 'Bạn không có quyền xóa bài viết này.');
        }

        $post->update(['deleted_by' => $request->user()->id]);
        $post->delete();

        return $this->successResponse(true, [], 'Bài viết đã được xóa.');
    }

    public function report(Request $request, int $id): JsonResponse
    {
        $post = Post::query()
            ->where('status', 'published')
            ->visibleTo($request->user())
            ->findOrFail($id);

        if ($post->user_id === $request->user()->id) {
            abort(403, 'Bạn không thể báo cáo bài viết của chính mình.');
        }

        $validated = $request->validate([
            'reason' => ['required', Rule::in(['spam', 'offensive', 'misinformation', 'inappropriate', 'other'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $alreadyReported = DB::table('post_reports')
            ->where('post_id', $id)
            ->where('reporter_id', $request->user()->id)
            ->exists();

        if (! $alreadyReported) {
            DB::table('post_reports')->insert([
                'post_id' => $id,
                'reporter_id' => $request->user()->id,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Notify all admins about the new report
            $reporter = $request->user();
            NotificationService::dispatch(
                title: 'Báo cáo vi phạm mới',
                message: "{$reporter->full_name} đã báo cáo bài viết \"{$post->title}\".",
                action: 'created',
                entityType: 'post_report',
                entityId: $id,
                performedBy: $reporter->full_name,
                link: '/community/reports',
            );
        }

        return $this->successResponse(true, [], 'Báo cáo đã được ghi nhận.');
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $userId = $viewer?->id;

        $post = Post::with([
            'user:id,full_name,username,email,avatar,student_code',
            'channel:id,name,slug',
        ])
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->where(function ($query) use ($userId) {
                $query->where('status', 'published');

                if ($userId) {
                    $query->orWhere(function ($ownArchived) use ($userId) {
                        $ownArchived
                            ->where('status', 'archived')
                            ->where('user_id', $userId);
                    });
                }
            })
            ->visibleTo($viewer)
            ->findOrFail($id);

        $data = $this->transformPost($post);
        $data['content'] = $post->content;

        // Reaction breakdown by type
        $data['reaction_summary'] = Reaction::where('target_type', 'post')
            ->where('target_id', $id)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $data['my_reaction'] = $userId
            ? Reaction::where('user_id', $userId)
                ->where('target_type', 'post')
                ->where('target_id', $id)
                ->value('type')
            : null;
        $data['my_bookmark'] = $userId
            ? DB::table('post_bookmarks')
                ->where('user_id', $userId)
                ->where('post_id', $id)
                ->exists()
            : false;
        $data['my_report'] = $userId
            ? DB::table('post_reports')
                ->where('reporter_id', $userId)
                ->where('post_id', $id)
                ->exists()
            : false;

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    /**
     * List users who reacted to a post (public).
     * Returns each reactor with their follow status for the authenticated viewer.
     */
    public function reactors(Request $request, int $id): JsonResponse
    {
        $viewer = $request->user('sanctum');

        Post::query()
            ->where('status', 'published')
            ->visibleTo($viewer)
            ->findOrFail($id);

        $reactorUsers = Reaction::where('target_type', 'post')
            ->where('target_id', $id)
            ->with('user:id,full_name,username,email,avatar')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($r) => $r->user)
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

    /**
     * Toggle a reaction on a post (auth required).
     * Same type → remove. Different type → switch. No reaction → add.
     */
    public function react(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'type' => ['required', Rule::enum(ReactionType::class)],
        ]);

        $post = Post::query()
            ->with('user:id,full_name,avatar,username')
            ->where('status', 'published')
            ->visibleTo($request->user())
            ->findOrFail($id);

        $userId = $request->user()->id;
        $type = $request->input('type');

        $existing = Reaction::where('user_id', $userId)
            ->where('target_type', 'post')
            ->where('target_id', $id)
            ->first();

        $reacted = false;
        $myReaction = null;
        $isNewReaction = false;

        if ($existing) {
            if ($existing->type === $type) {
                // Same reaction → remove (toggle off)
                $existing->delete();
            } else {
                // Different reaction → update type
                $existing->type = $type;
                $existing->save();
                $reacted = true;
                $myReaction = $type;
            }
        } else {
            Reaction::create([
                'user_id' => $userId,
                'target_type' => 'post',
                'target_id' => $id,
                'type' => $type,
                'created_at' => now(),
            ]);
            $reacted = true;
            $myReaction = $type;
            $isNewReaction = true;
        }

        // Updated summary
        $summary = Reaction::where('target_type', 'post')
            ->where('target_id', $id)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        // Notify post owner on new reaction via UserNotificationService
        if ($isNewReaction) {
            if ($post?->user) {
                UserNotificationService::dispatchReaction($post->user, $request->user(), $post, $type);
            }
        }

        return $this->successResponse(true, [
            'reacted' => $reacted,
            'my_reaction' => $myReaction,
            'reactions_count' => (int) $summary->sum(),
            'reaction_summary' => $summary,
        ], ApiMessage::UPDATED);
    }

    /**
     * Create a new comment (or reply) on a post (auth required).
     */
    public function comment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'content' => ['required', 'string', 'min:1', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        $post = Post::query()
            ->with('user:id,full_name,avatar,username')
            ->where('status', 'published')
            ->visibleTo($request->user())
            ->findOrFail($id);

        $parentId = $request->input('parent_id');
        $depth = 0;

        if ($parentId) {
            $parent = Comment::findOrFail($parentId);
            abort_if($parent->post_id !== $id, 422, 'Parent comment not found on this post');
            $depth = 1;
        }

        $comment = Comment::create([
            'post_id' => $id,
            'user_id' => $request->user()->id,
            'content' => $request->input('content'),
            'parent_id' => $parentId,
            'depth' => $depth,
        ]);

        // Kiểm duyệt AI chạy nền: bình luận hiển thị ngay, tự ẩn sau nếu vi phạm.
        if (config('services.gemini.moderation_enabled')) {
            ModerateCommentJob::dispatch($comment->id);
        }

        $comment->load('user:id,full_name,username,email,avatar');

        if ($parentId) {
            // Reply: notify the parent comment author
            $parent->load('user:id,full_name,avatar,username');
            if ($parent->user) {
                UserNotificationService::dispatchCommentReply(
                    $parent->user, $request->user(), $comment->id, $post, $comment->content,
                );
            }
        } else {
            // Top-level comment: notify the post owner
            if ($post?->user) {
                UserNotificationService::dispatchComment($post->user, $request->user(), $post, $comment->content, $comment->id);
            }
        }

        return $this->createdResponse($this->transformComment($comment));
    }

    public function comments(Request $request, int $id): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $userId = $viewer?->id;

        // Ensure the post is visible to the requester, or is the current user's own archived post.
        Post::query()
            ->whereKey($id)
            ->where(function ($query) use ($userId) {
                $query->where('status', 'published');

                if ($userId) {
                    $query->orWhere(function ($ownArchived) use ($userId) {
                        $ownArchived
                            ->where('status', 'archived')
                            ->where('user_id', $userId);
                    });
                }
            })
            ->visibleTo($viewer)
            ->firstOrFail();

        // Load ALL visible (non-hidden, non-deleted) comments for this post ordered by date
        $myReactionSelect = $userId
            ? ", (SELECT type FROM reactions WHERE target_type = 'comment' AND target_id = comments.id AND user_id = {$userId} LIMIT 1) as my_reaction"
            : ', NULL as my_reaction';

        $allComments = Comment::with('user:id,full_name,username,email,avatar')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count'.$myReactionSelect)
            ->where('post_id', $id)
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'asc')
            ->get();

        // Organise: top-level first, then attach replies
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

    // -------------------------------------------------------------------------

    private function transformPost(Post $post): array
    {
        $user = $post->user;
        $channel = $post->channel;
        $content = $post->content ?? '';
        $plainContent = strip_tags($content);
        $excerptLimit = 200;
        $excerpt = Str::limit($plainContent, $excerptLimit);
        $mediaUrls = $post->media_urls ?? [];

        return [
            'id' => $post->id,
            'user' => $user ? [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'student_code' => $user->student_code,
            ] : null,
            'channel' => $channel ? [
                'id' => $channel->id,
                'name' => $channel->name,
                'slug' => $channel->slug,
            ] : null,
            'title' => $post->title ?? '',
            'content' => $content,
            'excerpt' => $excerpt,
            'is_excerpt_truncated' => Str::length($plainContent) > $excerptLimit,
            'featured_image' => count($mediaUrls) > 0 ? $mediaUrls[0] : null,
            'status' => $post->status,
            'visibility' => $post->visibility ?? 'public',
            'is_pinned' => (bool) $post->is_pinned,
            'comments_count' => $post->comments_count ?? 0,
            'reactions_count' => (int) ($post->reactions_count ?? 0),
            'tags' => [],
            'media_urls' => $mediaUrls,
            'created_at' => $post->created_at?->toIso8601String(),
        ];
    }

    private function detectMediaType(?string $mimeType): string
    {
        return match (true) {
            $mimeType === 'image/gif' => 'gif',
            is_string($mimeType) && Str::startsWith($mimeType, 'video/') => 'video',
            default => 'image',
        };
    }

    private function sanitizePostContent(string $content): string
    {
        $content = preg_replace('#<(script|style|iframe|object|embed|link|meta)[^>]*>.*?</\1>#is', '', $content) ?? '';
        $content = preg_replace('#</?(script|style|iframe|object|embed|link|meta)[^>]*>#i', '', $content) ?? '';
        $content = preg_replace('/\s+on[a-z]+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', '', $content) ?? '';
        $content = preg_replace('/\s+(href|src)\s*=\s*("|\')\s*javascript:[^"\']*\2/i', ' $1="#"', $content) ?? '';
        $content = preg_replace('/\s+(href|src)\s*=\s*javascript:[^\s>]+/i', ' $1="#"', $content) ?? '';

        return trim($content);
    }

    private function transformComment(Comment $comment): array
    {
        $user = $comment->user;

        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'user' => $user ? [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ] : null,
            'content' => $comment->is_hidden ? null : $comment->content,
            'is_hidden' => (bool) $comment->is_hidden,
            'reactions_count' => (int) ($comment->reactions_count ?? 0),
            'my_reaction' => $comment->my_reaction ?? null,
            'created_at' => $comment->created_at?->toIso8601String(),
        ];
    }

    /**
     * Toggle a reaction on a comment (auth required).
     */
    public function reactComment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'type' => ['required', Rule::enum(ReactionType::class)],
        ]);

        $comment = Comment::query()
            ->whereNull('deleted_at')
            ->where('is_hidden', false)
            ->findOrFail($id);

        if ($comment->post_id) {
            Post::query()
                ->whereKey($comment->post_id)
                ->where('status', 'published')
                ->visibleTo($request->user())
                ->firstOrFail();
        }

        $userId = $request->user()->id;
        $type = $request->input('type');

        $existing = Reaction::where('user_id', $userId)
            ->where('target_type', 'comment')
            ->where('target_id', $id)
            ->first();

        $reacted = false;
        $myReaction = null;

        if ($existing) {
            if ($existing->type === $type) {
                $existing->delete();
            } else {
                $existing->type = $type;
                $existing->save();
                $reacted = true;
                $myReaction = $type;
            }
        } else {
            Reaction::create([
                'user_id' => $userId,
                'target_type' => 'comment',
                'target_id' => $id,
                'type' => $type,
                'created_at' => now(),
            ]);
            $reacted = true;
            $myReaction = $type;
        }

        $reactionsCount = Reaction::where('target_type', 'comment')
            ->where('target_id', $id)
            ->count();

        if ($reacted && $comment->blog_id) {
            $comment->loadMissing('user:id,full_name,avatar,username');
            $blog = \App\Models\Blog::select('id', 'slug')->find($comment->blog_id);
            if ($blog && $comment->user) {
                \App\Services\UserNotificationService::dispatchBlogCommentReaction(
                    $comment->user, $request->user(), $blog, $comment->id, $type,
                );
            }
        }

        return $this->successResponse(true, [
            'reacted' => $reacted,
            'my_reaction' => $myReaction,
            'reactions_count' => $reactionsCount,
        ], ApiMessage::UPDATED);
    }
}
