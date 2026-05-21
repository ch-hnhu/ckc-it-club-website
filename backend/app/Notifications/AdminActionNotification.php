<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AdminActionNotification extends Notification
{
    public function __construct(
        private string $title,
        private string $message,
        private string $action,
        private string $entityType,
        private ?int $entityId,
        private string $performedBy,
        private ?string $link = null,
    ) {}

    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(mixed $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'action' => $this->action,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'performed_by' => $this->performedBy,
            'link' => $this->link,
        ];
    }
}
