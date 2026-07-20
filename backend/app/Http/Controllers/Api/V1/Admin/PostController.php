<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Post;
use App\Models\PostReport;
use App\Services\NotificationService;
use App\Services\SupabaseStorageService;
use App\Services\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}
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
        $request->validate([
            'status' => 'required|in:published,hidden,draft,archived',
            'reason' => 'required_if:status,hidden|nullable|string|max:500',
        ], [
            'reason.required_if' => 'Vui lòng nhập lý do ẩn bài đăng.',
        ]);

        $previousStatus = $post->status;
        $newStatus      = $request->string('status')->value();
        $reason         = trim((string) $request->input('reason'));

        if ($newStatus === 'hidden') {
            // Lưu lý do ẩn để hiển thị cho admin và thông báo cho chủ bài đăng
            $post->update([
                'status'            => $newStatus,
                'moderation_reason' => $reason,
                'moderated_at'      => now(),
            ]);
        } elseif ($previousStatus === 'hidden') {
            // Hiện lại bài: lý do ẩn cũ không còn hiệu lực
            $post->update([
                'status'            => $newStatus,
                'moderation_reason' => null,
                'moderated_at'      => null,
            ]);
        } else {
            $post->update(['status' => $newStatus]);
        }

        // Thông báo cho chủ bài đăng khi bài bị admin ẩn
        if ($newStatus === 'hidden' && $previousStatus !== 'hidden') {
            $post->loadMissing('user');
            if ($post->user && $post->user->id !== $request->user()->id) {
                UserNotificationService::dispatchPostHidden($post->user, $request->user(), $post, $reason);
            }
        }

        // Khi un-hide: reset tất cả report resolved → pending để admin xem xét lại
        if ($previousStatus === 'hidden' && $newStatus !== 'hidden') {
            $resetCount = PostReport::where('post_id', $post->id)
                ->where('status', 'resolved')
                ->update([
                    'status'      => 'pending',
                    'resolved_by' => null,
                    'resolved_at' => null,
                ]);

            if ($resetCount > 0) {
                $admin = $request->user();
                NotificationService::dispatch(
                    title: 'Báo cáo cần xem xét lại',
                    message: "{$admin->full_name} đã bật lại bài viết \"{$post->title}\". {$resetCount} báo cáo đã được chuyển về chờ xử lý.",
                    action: 'status_changed',
                    entityType: 'post_report',
                    entityId: $post->id,
                    performedBy: $admin->full_name,
                    link: '/community/reports',
                    excludeUserId: $request->user()->id,
                );
            }
        }

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

    public function forceDestroy(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $post  = Post::onlyTrashed()->findOrFail($id);

        $mediaUrls = $post->media_urls ?? [];
        if (is_array($mediaUrls)) {
            foreach ($mediaUrls as $url) {
                if ($url) {
                    $this->storage->delete($url);
                }
            }
        }

        $post->forceDelete();

        NotificationService::dispatch(
            title: 'Bài đăng đã bị xóa vĩnh viễn',
            message: "{$admin->full_name} đã xóa vĩnh viễn bài đăng #{$id}.",
            action: 'force_deleted',
            entityType: 'post',
            entityId: $id,
            performedBy: $admin->full_name,
            link: '/community/posts',
            excludeUserId: $admin->id,
        );

        return $this->successResponse(true, null, 'Đã xóa vĩnh viễn bài đăng.');
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
            'moderation_reason' => $post->moderation_reason,
            'moderated_at'    => $post->moderated_at?->toIso8601String(),
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
