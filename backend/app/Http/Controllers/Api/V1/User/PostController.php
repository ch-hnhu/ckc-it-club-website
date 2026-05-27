<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        $channel = $request->query('channel'); // channel slug

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

        $posts->getCollection()->transform(fn (Post $post) => $this->transformPost($post));

        return $this->paginatedResponse($posts, ApiMessage::RETRIEVED);
    }

    private function transformPost(Post $post): array
    {
        $user    = $post->user;
        $channel = $post->channel;

        // Strip HTML tags and truncate to 200 chars for excerpt
        $excerpt = Str::limit(strip_tags($post->content ?? ''), 200);

        // First media URL as featured image
        $mediaUrls     = $post->media_urls ?? [];
        $featuredImage = count($mediaUrls) > 0 ? $mediaUrls[0] : null;

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
            'featured_image'  => $featuredImage,
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
}
