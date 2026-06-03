<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class UserCommunityNotification extends Notification
{
    public function __construct(private readonly array $data) {}

    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(mixed $notifiable): array
    {
        return $this->data;
    }
}
