<?php

namespace Tests\Feature;

use App\Models\Blog;
use App\Models\Channel;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\PointRuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GamificationObserverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PointRuleSeeder::class);
    }

    public function test_publishing_a_blog_awards_points_once(): void
    {
        $user = $this->createUser();

        $blog = Blog::query()->create([
            'author_id' => $user->id,
            'title' => 'Bài blog',
            'slug' => 'bai-blog',
            'content' => 'noi dung',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->assertSame(15, $user->fresh()->total_points);
        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $user->id,
            'source_type' => 'blog',
            'source_id' => $blog->id,
            'points' => 15,
        ]);

        // Lưu lại blog lần nữa không được cộng thêm (dedup theo source).
        $blog->update(['title' => 'Đổi tiêu đề']);
        $this->assertSame(15, $user->fresh()->total_points);
    }

    public function test_draft_blog_then_publish_awards_on_transition(): void
    {
        $user = $this->createUser();

        $blog = Blog::query()->create([
            'author_id' => $user->id,
            'title' => 'Nháp',
            'slug' => 'nhap',
            'content' => 'noi dung',
            'status' => 'draft',
        ]);
        $this->assertSame(0, $user->fresh()->total_points);

        $blog->update(['status' => 'published', 'published_at' => now()]);
        $this->assertSame(15, $user->fresh()->total_points);
    }

    public function test_comment_award_is_capped_per_day(): void
    {
        $user = $this->createUser();
        $channel = Channel::query()->create(['name' => 'General', 'slug' => 'general']);
        $post = Post::query()->create([
            'user_id' => $user->id,
            'channel_id' => $channel->id,
            'title' => 'Bai dang',
            'content' => 'bai dang',
            'status' => 'published',
            'visibility' => 'public',
        ]);

        // Tạo 12 comment, rule comment.created cap 10/ngày, mỗi comment +2 => tối đa 20.
        for ($i = 0; $i < 12; $i++) {
            Comment::query()->create([
                'post_id' => $post->id,
                'user_id' => $user->id,
                'content' => "cmt {$i}",
            ]);
        }

        // 10 (post +10 published) + 10*2 (comment cap) = 30.
        $this->assertSame(30, $user->fresh()->total_points);
    }

    private function createUser(): User
    {
        return User::query()->create([
            'email' => 'gamer'.uniqid().'@example.com',
            'username' => 'gamer'.uniqid(),
            'full_name' => 'Gamer',
            'is_active' => true,
        ]);
    }
}
