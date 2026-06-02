<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ArchivedPostDetailAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_their_archived_post_detail(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $post = $this->createPost($owner, 'archived');

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/community/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.status', 'archived')
            ->assertJsonPath('data.user.id', $owner->id);
    }

    public function test_guest_cannot_view_archived_post_detail(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $post = $this->createPost($owner, 'archived');

        $this->getJson("/api/v1/community/posts/{$post->id}")
            ->assertNotFound();
    }

    public function test_other_user_cannot_view_archived_post_detail(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $otherUser = $this->createUser('other@example.com', 'other');
        $post = $this->createPost($owner, 'archived');

        Sanctum::actingAs($otherUser);

        $this->getJson("/api/v1/community/posts/{$post->id}")
            ->assertNotFound();
    }

    public function test_owner_can_view_comments_on_their_archived_post(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $post = $this->createPost($owner, 'archived');
        $comment = Comment::query()->create([
            'post_id' => $post->id,
            'user_id' => $owner->id,
            'content' => 'Archived post comment',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/community/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $comment->id)
            ->assertJsonPath('data.0.content', 'Archived post comment');
    }

    public function test_owner_can_pin_and_unpin_their_post(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $post = $this->createPost($owner, 'published');

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/community/posts/{$post->id}", [
            'is_pinned' => true,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_pinned', true);

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'is_pinned' => true,
        ]);
        $this->assertNotNull($post->fresh()->pinned_at);

        $this->patchJson("/api/v1/community/posts/{$post->id}", [
            'is_pinned' => false,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_pinned', false);

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'is_pinned' => false,
            'pinned_at' => null,
        ]);
    }

    public function test_profile_post_listing_returns_pinned_posts_first(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $newerPost = $this->createPost($owner, 'published');
        $newerPost->update(['created_at' => now()]);
        $pinnedPost = $this->createPost($owner, 'published');
        $pinnedPost->update([
            'created_at' => now()->subDay(),
            'is_pinned' => true,
            'pinned_at' => now(),
        ]);

        $this->getJson('/api/v1/community/posts?username=owner&sort=created_at&order=desc')
            ->assertOk()
            ->assertJsonPath('data.0.id', $pinnedPost->id)
            ->assertJsonPath('data.0.is_pinned', true)
            ->assertJsonPath('data.1.id', $newerPost->id);
    }

    private function createUser(string $email, string $username): User
    {
        return User::query()->create([
            'email' => $email,
            'username' => $username,
            'full_name' => ucfirst($username),
            'is_active' => true,
        ]);
    }

    private function createPost(User $owner, string $status): Post
    {
        $channel = Channel::query()->firstOrCreate(
            ['slug' => 'general'],
            ['name' => 'General'],
        );

        return Post::query()->create([
            'user_id' => $owner->id,
            'channel_id' => $channel->id,
            'title' => 'Archived post title',
            'content' => 'Archived post content',
            'visibility' => 'public',
            'status' => $status,
        ]);
    }
}
