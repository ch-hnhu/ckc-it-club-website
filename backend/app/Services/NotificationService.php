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
        ?int $excludeUserId = null,
    ): void {
        $notification = new AdminActionNotification($title, $message, $action, $entityType, $entityId, $performedBy, $link);

        User::role(RolesEnum::adminRoles())
            ->when($excludeUserId, fn ($q) => $q->where('id', '!=', $excludeUserId))
            ->get()
            ->each(fn (User $user) => $user->notify($notification));
    }
}
