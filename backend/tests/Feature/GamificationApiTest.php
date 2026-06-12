<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PointService;
use Database\Seeders\LevelSeeder;
use Database\Seeders\PointRuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GamificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LevelSeeder::class);
        $this->seed(PointRuleSeeder::class);
    }

    public function test_me_returns_points_level_and_ranks(): void
    {
        $me = $this->createUser('me');
        $rival = $this->createUser('rival');

        // me = 100 (Bạc), rival = 300 (Vàng) => me hạng 2 all-time.
        for ($i = 0; $i < 10; $i++) {
            PointService::award($me->fresh(), 'post.published');
        }
        for ($i = 0; $i < 30; $i++) {
            PointService::award($rival->fresh(), 'post.published');
        }

        Sanctum::actingAs($me->fresh());

        $this->getJson('/api/v1/gamification/me')
            ->assertOk()
            ->assertJsonPath('data.total_points', 100)
            ->assertJsonPath('data.level.name', 'Bạc')
            ->assertJsonPath('data.level.badge', '/assets/img/level02.png')
            ->assertJsonPath('data.next_level.name', 'Vàng')
            ->assertJsonPath('data.next_level.badge', '/assets/img/level03.png')
            ->assertJsonPath('data.points_to_next_level', 200)
            ->assertJsonPath('data.rank_all_time', 2);
    }

    public function test_history_lists_user_transactions(): void
    {
        $user = $this->createUser('player');
        PointService::award($user->fresh(), 'post.published');

        Sanctum::actingAs($user->fresh());

        $this->getJson('/api/v1/gamification/me/history')
            ->assertOk()
            ->assertJsonPath('data.0.points', 10)
            ->assertJsonPath('data.0.rule_key', 'post.published');
    }

    public function test_all_time_leaderboard_is_ordered_and_flags_me(): void
    {
        $top = $this->createUser('top');
        $me = $this->createUser('me');
        for ($i = 0; $i < 30; $i++) {
            PointService::award($top->fresh(), 'post.published');
        }
        PointService::award($me->fresh(), 'post.published');

        Sanctum::actingAs($me->fresh());

        $res = $this->getJson('/api/v1/gamification/leaderboard/all-time')->assertOk();
        $res->assertJsonPath('data.0.user_id', $top->id);
        $res->assertJsonPath('data.0.rank', 1);
        $res->assertJsonPath('data.0.level.badge', '/assets/img/level03.png');
        $res->assertJsonPath('data.1.user_id', $me->id);
        $res->assertJsonPath('data.1.is_me', true);
    }

    public function test_weekly_leaderboard_only_counts_current_week(): void
    {
        $user = $this->createUser('weekly');
        $tx = PointService::award($user->fresh(), 'post.published');
        // Đẩy giao dịch về tuần trước => không tính vào weekly.
        $tx->forceFill(['created_at' => now()->subWeeks(2)])->saveQuietly();

        Sanctum::actingAs($user->fresh());

        $this->getJson('/api/v1/gamification/leaderboard/weekly')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    private function createUser(string $name): User
    {
        return User::query()->create([
            'email' => $name.uniqid().'@example.com',
            'username' => $name.uniqid(),
            'full_name' => ucfirst($name),
            'is_active' => true,
        ]);
    }
}
