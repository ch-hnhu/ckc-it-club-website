<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_submit_contact_form(): void
    {
        $response = $this->postJson('/api/v1/contacts', [
            'full_name' => 'Nguyen Van A',
            'email' => 'nguyenvana@example.com',
            'subject' => 'Hoi dap ve hoat dong',
            'message' => 'Toi muon tim hieu them ve CLB.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'nguyenvana@example.com')
            ->assertJsonPath('data.full_name', 'Nguyen Van A')
            ->assertJsonPath('data.subject', 'Hoi dap ve hoat dong')
            ->assertJsonPath('data.message', 'Toi muon tim hieu them ve CLB.')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('contacts', [
            'email' => 'nguyenvana@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_contact_submission_requires_valid_payload(): void
    {
        $response = $this->postJson('/api/v1/contacts', [
            'full_name' => '',
            'email' => 'not-an-email',
            'subject' => '',
            'message' => '',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'full_name',
                'email',
                'subject',
                'message',
            ]);
    }
}
