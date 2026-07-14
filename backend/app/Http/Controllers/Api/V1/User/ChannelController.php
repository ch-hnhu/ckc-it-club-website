<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Channel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChannelController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user('sanctum');

        $channels = Channel::query()
            // Đếm đúng số bài người xem thấy được trên feed: published + đúng quyền xem (public/members/bài của mình)
            ->withCount(['posts' => fn ($q) => $q->where('status', 'published')->visibleTo($viewer)])
            ->orderBy('name')
            ->get();

        $data = $channels->map(fn (Channel $channel) => [
            'id'          => $channel->id,
            'name'        => $channel->name,
            'slug'        => $channel->slug,
            'description' => $channel->description,
            'image'       => $this->resolveImageUrl($channel->image),
            'posts_count' => $channel->posts_count ?? 0,
        ])->values()->toArray();

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    private function resolveImageUrl(?string $image): ?string
    {
        // DB now stores the full public URL (Supabase https://... or external).
        return $image ?: null;
    }
}
