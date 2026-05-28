<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\ReactionType;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Reaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['created_at', 'reactions_count'];
        $sort    = in_array($request->query('sort', 'created_at'), $allowedSorts)
            ? $request->query('sort', 'created_at')
            : 'created_at';
        $order   = in_array($request->query('order', 'desc'), ['asc', 'desc'])
            ? $request->query('order', 'desc')
            : 'desc';
        $perPage = min((int) $request->query('per_page', 15), 50);
        $channel = $request->query('channel');

        $posts = Post::query()
            ->with([
                'user:id,full_name,username,email,avatar,student_code',
                'channel:id,name,slug',
            ])
            ->withCount('comments')
            ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
            ->where('posts.status', 'published')
            ->when(
                $channel && $channel !== 'all',
                fn ($q) => $q->whereHas('channel', fn ($c) => $c->where('slug', $channel))
            )
            ->orderBy(
                $sort === 'reactions_count' ? 'reactions_count' : "posts.{$sort}",
                $order
            )
            ->paginate($perPage);

        // Optionally enrich with current user's reactions (one batch query)
        $userId = auth('sanctum')->id();
        $myReactions = [];
        if ($userId) {
            $postIds = $posts->pluck('id')->toArray();
            $myReactions = Reaction::where('user_id', $userId)
                ->where('target_type', 'post')
                ->whereIn('target_id', $postIds)
                ->pluck('type', 'target_id')
                ->toArray();
        }

        $posts->getCollection()->transform(function (Post $post) use ($myReactions) {
            $data               = $this->transformPost($post);
            $data['my_reaction'] = $myReactions[$post->id] ?? null;
            return $data;
        });

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    public function show(int $id): JsonResponse
    {
        $post = Post::with([
            'user:id,full_name,username,email,avatar,student_code',
            'channel:id,name,slug',
        ])
        ->withCount('comments')
        ->selectRaw('posts.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "post" AND target_id = posts.id) as reactions_count')
        ->where('status', 'published')
        ->findOrFail($id);

        $data            = $this->transformPost($post);
        $data['content'] = $post->content;

        // Reaction breakdown by type
        $data['reaction_summary'] = Reaction::where('target_type', 'post')
            ->where('target_id', $id)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        // Current user's own reaction (null for guests)
        $userId = auth('sanctum')->id();
        $data['my_reaction'] = $userId
            ? Reaction::where('user_id', $userId)
                ->where('target_type', 'post')
                ->where('target_id', $id)
                ->value('type')
            : null;

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

        Post::where('status', 'published')->findOrFail($id);

        $userId = $request->user()->id;
        $type   = $request->input('type');

        $existing = Reaction::where('user_id', $userId)
            ->where('target_type', 'post')
            ->where('target_id', $id)
            ->first();

        $reacted    = false;
        $myReaction = null;

        if ($existing) {
            if ($existing->type === $type) {
                // Same reaction → remove (toggle off)
                $existing->delete();
            } else {
                // Different reaction → update type
                $existing->type = $type;
                $existing->save();
                $reacted    = true;
                $myReaction = $type;
            }
        } else {
            Reaction::create([
                'user_id'     => $userId,
                'target_type' => 'post',
                'target_id'   => $id,
                'type'        => $type,
                'created_at'  => now(),
            ]);
            $reacted    = true;
            $myReaction = $type;
        }

        // Updated summary
        $summary = Reaction::where('target_type', 'post')
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
     * Create a new comment (or reply) on a post (auth required).
     */
    public function comment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'content'   => ['required', 'string', 'min:1', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        Post::where('status', 'published')->findOrFail($id);

        $parentId = $request->input('parent_id');
        $depth    = 0;

        if ($parentId) {
            $parent = Comment::findOrFail($parentId);
            abort_if($parent->post_id !== $id, 422, 'Parent comment not found on this post');
            $depth = 1;
        }

        $comment = Comment::create([
            'post_id'   => $id,
            'user_id'   => $request->user()->id,
            'content'   => $request->input('content'),
            'parent_id' => $parentId,
            'depth'     => $depth,
        ]);

        $comment->load('user:id,full_name,username,email,avatar');

        return $this->createdResponse($this->transformComment($comment));
    }

    public function comments(Request $request, int $id): JsonResponse
    {
        // Ensure post exists and is published
        Post::where('status', 'published')->findOrFail($id);

        // Load ALL comments for this post ordered by date
        $allComments = Comment::with('user:id,full_name,username,email,avatar')
            ->selectRaw('comments.*, (SELECT COUNT(*) FROM reactions WHERE target_type = "comment" AND target_id = comments.id) as reactions_count')
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
        $user      = $post->user;
        $channel   = $post->channel;
        $excerpt   = Str::limit(strip_tags($post->content ?? ''), 200);
        $mediaUrls = $post->media_urls ?? [];

        return [
            'id'              => $post->id,
            'user'            => $user ? [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'username'     => $user->username,
                'email'        => $user->email,
                'avatar'       => $user->avatar,
                'student_code' => $user->student_code,
            ] : null,
            'channel'         => $channel ? [
                'id'   => $channel->id,
                'name' => $channel->name,
                'slug' => $channel->slug,
            ] : null,
            'title'           => $post->title ?? '',
            'excerpt'         => $excerpt,
            'featured_image'  => count($mediaUrls) > 0 ? $mediaUrls[0] : null,
            'status'          => $post->status,
            'visibility'      => $post->visibility ?? 'public',
            'is_pinned'       => false,
            'comments_count'  => $post->comments_count ?? 0,
            'reactions_count' => (int) ($post->reactions_count ?? 0),
            'tags'            => [],
            'media_urls'      => $mediaUrls,
            'created_at'      => $post->created_at?->toIso8601String(),
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
