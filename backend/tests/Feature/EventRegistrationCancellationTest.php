<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventRegistrationCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_cancel_registration_when_event_is_published(): void
    {
        $user = $this->createUser('attendee@example.com', 'attendee');
        $event = $this->createEvent('published');
        $registration = $this->createRegistration($event, $user);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/community/events/{$event->id}/register")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('event_registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_user_cannot_cancel_registration_when_event_is_ongoing(): void
    {
        $user = $this->createUser('attendee@example.com', 'attendee');
        $event = $this->createEvent('ongoing');
        $registration = $this->createRegistration($event, $user);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/community/events/{$event->id}/register")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Không thể hủy đăng ký khi sự kiện đã bắt đầu.');

        $this->assertDatabaseHas('event_registrations', [
            'id' => $registration->id,
            'status' => 'registered',
        ]);
    }

    public function test_user_cannot_cancel_registration_when_event_has_ended(): void
    {
        $user = $this->createUser('attendee@example.com', 'attendee');
        $event = $this->createEvent('ended');
        $registration = $this->createRegistration($event, $user);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/community/events/{$event->id}/register")
            ->assertUnprocessable();

        $this->assertDatabaseHas('event_registrations', [
            'id' => $registration->id,
            'status' => 'registered',
        ]);
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

    private function createEvent(string $status): Event
    {
        $creator = $this->createUser('creator@example.com', 'creator');

        return Event::query()->create([
            'created_by' => $creator->id,
            'title' => 'Test Event',
            'slug' => 'test-event',
            'start_at' => now()->addDay(),
            'end_at' => now()->addDays(2),
            'status' => $status,
        ]);
    }

    private function createRegistration(Event $event, User $user): EventRegistration
    {
        return EventRegistration::query()->create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'qr_token' => EventRegistration::generateQrToken($event->id, $user->id),
            'status' => 'registered',
            'registered_at' => now(),
        ]);
    }
}
