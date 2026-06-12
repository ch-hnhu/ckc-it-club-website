<?php

namespace Tests\Feature;

use App\Enums\RolesEnum;
use App\Models\PointRule;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GamificationAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_admin_can_create_point_rule(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/v1/point-rules', [
            'key' => 'custom.action',
            'name' => 'Hành động tùy chỉnh',
            'points' => 5,
            'max_per_day' => 3,
        ])->assertCreated()
            ->assertJsonPath('data.key', 'custom.action');

        $this->assertDatabaseHas('point_rules', ['key' => 'custom.action', 'points' => 5]);
    }

    public function test_point_rule_key_must_be_unique(): void
    {
        PointRule::query()->create(['key' => 'dup.key', 'name' => 'Dup', 'points' => 1, 'is_active' => true]);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/v1/point-rules', [
            'key' => 'dup.key',
            'name' => 'Another',
            'points' => 2,
        ])->assertStatus(422);
    }

    public function test_admin_can_create_and_delete_level(): void
    {
        Sanctum::actingAs($this->admin());

        $res = $this->post('/api/v1/levels', [
            'name' => 'Huyền Thoại',
            'min_points' => 5000,
            'badge' => UploadedFile::fake()->image('level06.png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $id = $res->json('data.id');
        $this->assertStringContainsString('/storage/level-badges/', $res->json('data.badge'));
        $this->assertDatabaseHas('levels', ['id' => $id]);

        $this->deleteJson("/api/v1/levels/{$id}")->assertOk();
        $this->assertDatabaseMissing('levels', ['id' => $id]);
    }

    public function test_regular_user_cannot_manage_point_rules(): void
    {
        $user = User::query()->create([
            'email' => 'plain@example.com',
            'username' => 'plain',
            'full_name' => 'Plain',
            'is_active' => true,
        ]);
        $user->assignRole(RolesEnum::USER->value);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/point-rules', [
            'key' => 'x.y',
            'name' => 'X',
            'points' => 1,
        ])->assertForbidden();
    }

    private function admin(): User
    {
        $admin = User::query()->create([
            'email' => 'admin@example.com',
            'username' => 'admin',
            'full_name' => 'Admin',
            'is_active' => true,
        ]);
        $admin->syncRoles(RolesEnum::ADMIN->value);

        return $admin;
    }
}
