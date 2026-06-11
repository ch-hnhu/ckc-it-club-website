<?php

namespace App\Services;

use App\Enums\RolesEnum;
use App\Models\Role;
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

        // Spatie's role() scope throws RoleDoesNotExist for unknown names,
        // so only query with the admin roles that actually exist.
        $existingRoles = Role::query()
            ->whereIn('name', RolesEnum::adminRoles())
            ->where('guard_name', 'web')
            ->pluck('name')
            ->all();

        if ($existingRoles === []) {
            return;
        }

        User::role($existingRoles)
            ->when($excludeUserId, fn ($q) => $q->where('id', '!=', $excludeUserId))
            ->get()
            ->each(fn (User $user) => $user->notify($notification));
    }
}
