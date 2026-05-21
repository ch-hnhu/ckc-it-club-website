<?php

namespace App\Services;

use App\Enums\RolesEnum;
use App\Models\User;
use App\Notifications\AdminActionNotification;

class NotificationService
{
    public static function dispatch(
        string $title,
        string $message,
        string $action,
        string $entityType,
        ?int $entityId,
        string $performedBy,
        ?string $link = null,
    ): void {
        $notification = new AdminActionNotification($title, $message, $action, $entityType, $entityId, $performedBy, $link);

        User::role(RolesEnum::adminRoles())
            ->get()
            ->each(fn(User $user) => $user->notify($notification));
    }
}
