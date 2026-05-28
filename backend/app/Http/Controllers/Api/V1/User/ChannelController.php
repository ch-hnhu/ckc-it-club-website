<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Channel;
use Illuminate\Http\JsonResponse;

class ChannelController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $channels = Channel::query()
            ->withCount(['posts' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('name')
            ->get();

        $data = $channels->map(fn (Channel $channel) => [
            'id'          => $channel->id,
            'name'        => $channel->name,
            'slug'        => $channel->slug,
            'description' => $channel->description,
            'image'       => $channel->image,
            'posts_count' => $channel->posts_count ?? 0,
        ])->values()->toArray();

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }
}
