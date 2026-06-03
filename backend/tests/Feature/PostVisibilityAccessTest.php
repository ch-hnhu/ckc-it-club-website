<?php

namespace Tests\Feature;

use App\Enums\RolesEnum;
use App\Models\Channel;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostVisibilityAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_only_sees_public_posts_in_listing(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $public = $this->createPost($owner, 'public');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        $this->getJson('/api/v1/community/posts')
            ->assertOk()
            ->assertJsonPath('data.0.id', $public->id)
            ->assertJsonMissing(['id' => $members->id])
            ->assertJsonMissing(['id' => $private->id]);
    }

    public function test_club_member_can_see_members_posts_but_not_private_posts(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $viewer = $this->createClubMember('member@example.com', 'member');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        Sanctum::actingAs($viewer);

        $this->getJson('/api/v1/community/posts')
            ->assertOk()
            ->assertJsonFragment(['id' => $members->id])
            ->assertJsonMissing(['id' => $private->id]);

        $this->getJson("/api/v1/community/posts/{$members->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $members->id);

        $this->getJson("/api/v1/community/posts/{$private->id}")
            ->assertNotFound();
    }

    public function test_legacy_club_member_role_name_can_see_members_posts(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $viewer = $this->createUser('legacy-member@example.com', 'legacy_member');
        Role::findOrCreate('club_member', 'web');
        $viewer->assignRole('club_member');
        $members = $this->createPost($owner, 'members');

        Sanctum::actingAs($viewer);

        $this->getJson("/api/v1/community/posts/{$members->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $members->id);
    }

    public function test_regular_user_cannot_see_members_or_private_posts_they_do_not_own(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $viewer = $this->createUser('viewer@example.com', 'viewer');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        Sanctum::actingAs($viewer);

        $this->getJson('/api/v1/community/posts')
            ->assertOk()
            ->assertJsonMissing(['id' => $members->id])
            ->assertJsonMissing(['id' => $private->id]);

        $this->getJson("/api/v1/community/posts/{$members->id}")
            ->assertNotFound();

        $this->getJson("/api/v1/community/posts/{$private->id}")
            ->assertNotFound();
    }

    public function test_owner_can_see_their_private_and_members_posts(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/community/posts?username=owner')
            ->assertOk()
            ->assertJsonFragment(['id' => $members->id])
            ->assertJsonFragment(['id' => $private->id]);

        $this->getJson("/api/v1/community/posts/{$private->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $private->id);
    }

    public function test_comments_follow_post_visibility(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $regularUser = $this->createUser('viewer@example.com', 'viewer');
        $clubMember = $this->createClubMember('member@example.com', 'member');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        Comment::query()->create([
            'post_id' => $members->id,
            'user_id' => $owner->id,
            'content' => 'Members-only comment',
        ]);
        Comment::query()->create([
            'post_id' => $private->id,
            'user_id' => $owner->id,
            'content' => 'Private comment',
        ]);

        Sanctum::actingAs($regularUser);
        $this->getJson("/api/v1/community/posts/{$members->id}/comments")
            ->assertNotFound();

        Sanctum::actingAs($clubMember);
        $this->getJson("/api/v1/community/posts/{$members->id}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.content', 'Members-only comment');
        $this->getJson("/api/v1/community/posts/{$private->id}/comments")
            ->assertNotFound();

        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/community/posts/{$private->id}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.content', 'Private comment');
    }

    public function test_post_actions_follow_visibility(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $regularUser = $this->createUser('viewer@example.com', 'viewer');
        $clubMember = $this->createClubMember('member@example.com', 'member');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');
        $privateComment = Comment::query()->create([
            'post_id' => $private->id,
            'user_id' => $owner->id,
            'content' => 'Private comment',
        ]);

        Sanctum::actingAs($regularUser);

        $this->postJson("/api/v1/community/posts/{$members->id}/bookmark")
            ->assertNotFound();
        $this->postJson("/api/v1/community/posts/{$members->id}/reactions", ['type' => 'like'])
            ->assertNotFound();
        $this->postJson("/api/v1/community/posts/{$members->id}/report", ['reason' => 'spam'])
            ->assertNotFound();
        $this->postJson("/api/v1/community/comments/{$privateComment->id}/reactions", ['type' => 'like'])
            ->assertNotFound();

        Sanctum::actingAs($clubMember);

        $this->postJson("/api/v1/community/posts/{$members->id}/bookmark")
            ->assertOk()
            ->assertJsonPath('data.bookmarked', true);
        $this->postJson("/api/v1/community/posts/{$members->id}/reactions", ['type' => 'like'])
            ->assertOk()
            ->assertJsonPath('data.reacted', true);
        $this->postJson("/api/v1/community/posts/{$members->id}/report", ['reason' => 'spam'])
            ->assertOk();
        $this->postJson("/api/v1/community/comments/{$privateComment->id}/reactions", ['type' => 'like'])
            ->assertNotFound();
    }

    public function test_profile_post_badges_follow_visibility_but_likes_are_total(): void
    {
        $owner = $this->createUser('owner@example.com', 'owner');
        $regularUser = $this->createUser('viewer@example.com', 'viewer');
        $clubMember = $this->createClubMember('member@example.com', 'member');
        $reactor = $this->createUser('reactor@example.com', 'reactor');
        $public = $this->createPost($owner, 'public');
        $members = $this->createPost($owner, 'members');
        $private = $this->createPost($owner, 'private');

        foreach ([$public, $members, $private] as $post) {
            DB::table('reactions')->insert([
                'user_id' => $reactor->id,
                'target_type' => 'post',
                'target_id' => $post->id,
                'type' => 'like',
                'created_at' => now(),
            ]);
        }

        $this->getJson('/api/v1/users/profile/owner')
            ->assertOk()
            ->assertJsonPath('data.posts_count', 1)
            ->assertJsonPath('data.content_count', 1)
            ->assertJsonPath('data.likes_count', 3);

        Sanctum::actingAs($regularUser);
        $this->getJson('/api/v1/users/profile/owner')
            ->assertOk()
            ->assertJsonPath('data.posts_count', 1)
            ->assertJsonPath('data.content_count', 1)
            ->assertJsonPath('data.likes_count', 3);

        Sanctum::actingAs($clubMember);
        $this->getJson('/api/v1/users/profile/owner')
            ->assertOk()
            ->assertJsonPath('data.posts_count', 2)
            ->assertJsonPath('data.content_count', 2)
            ->assertJsonPath('data.likes_count', 3);

        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/users/profile/owner')
            ->assertOk()
            ->assertJsonPath('data.posts_count', 3)
            ->assertJsonPath('data.content_count', 3)
            ->assertJsonPath('data.likes_count', 3);
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

    private function createClubMember(string $email, string $username): User
    {
        $user = $this->createUser($email, $username);
        Role::findOrCreate(RolesEnum::CLUB_MEMBER->value, 'web');
        $user->assignRole(RolesEnum::CLUB_MEMBER->value);

        return $user;
    }

    private function createPost(User $owner, string $visibility): Post
    {
        $channel = Channel::query()->firstOrCreate(
            ['slug' => 'general'],
            ['name' => 'General'],
        );

        return Post::query()->create([
            'user_id' => $owner->id,
            'channel_id' => $channel->id,
            'title' => ucfirst($visibility).' post title',
            'content' => ucfirst($visibility).' post content',
            'visibility' => $visibility,
            'status' => 'published',
        ]);
    }
}
