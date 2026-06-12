<?php

namespace Tests\Feature;

use App\Models\PointRule;
use App\Models\Rank;
use App\Models\User;
use App\Services\PointService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PointServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_award_adds_points_and_records_transaction(): void
    {
        $user = $this->createUser();
        $rule = $this->createRule('blog.published', 15);

        $tx = PointService::award($user, 'blog.published');

        $this->assertNotNull($tx);
        $this->assertSame(15, $tx->points);
        $this->assertSame(15, $user->fresh()->total_points);
        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $user->id,
            'point_rule_id' => $rule->id,
            'points' => 15,
        ]);
    }

    public function test_award_is_skipped_when_rule_is_inactive_or_missing(): void
    {
        $user = $this->createUser();
        $this->createRule('blog.published', 15, ['is_active' => false]);

        $this->assertNull(PointService::award($user, 'blog.published'));
        $this->assertNull(PointService::award($user, 'does.not.exist'));
        $this->assertSame(0, $user->fresh()->total_points);
    }

    public function test_award_prevents_duplicate_points_for_same_source(): void
    {
        $user = $this->createUser();
        $this->createRule('blog.published', 15);
        $source = $this->createRule('post.published', 99); // dùng tạm 1 model bất kỳ làm source

        $first = PointService::award($user, 'blog.published', $source);
        $second = PointService::award($user, 'blog.published', $source);

        $this->assertNotNull($first);
        $this->assertNull($second);
        $this->assertSame(15, $user->fresh()->total_points);
    }

    public function test_award_respects_max_per_day(): void
    {
        $user = $this->createUser();
        $this->createRule('comment.created', 2, ['max_per_day' => 3]);

        $awarded = 0;
        for ($i = 0; $i < 5; $i++) {
            if (PointService::award($user->fresh(), 'comment.created')) {
                $awarded++;
            }
        }

        $this->assertSame(3, $awarded);
        $this->assertSame(6, $user->fresh()->total_points);
    }

    public function test_rank_updates_automatically_with_total_points(): void
    {
        $user = $this->createUser();
        Rank::query()->create(['name' => 'Đồng', 'min_points' => 0]);
        $silver = Rank::query()->create(['name' => 'Bạc', 'min_points' => 100]);
        $this->createRule('post.published', 50);

        PointService::award($user, 'post.published');
        $this->assertNotSame($silver->id, $user->fresh()->rank_id);

        PointService::award($user->fresh(), 'post.published');
        $this->assertSame($silver->id, $user->fresh()->rank_id);
        $this->assertSame(100, $user->fresh()->total_points);
    }

    private function createUser(): User
    {
        return User::query()->create([
            'email' => 'player'.uniqid().'@example.com',
            'username' => 'player'.uniqid(),
            'full_name' => 'Player',
            'is_active' => true,
        ]);
    }

    private function createRule(string $key, int $points, array $overrides = []): PointRule
    {
        return PointRule::query()->create(array_merge([
            'key' => $key,
            'name' => $key,
            'points' => $points,
            'is_active' => true,
        ], $overrides));
    }
}
