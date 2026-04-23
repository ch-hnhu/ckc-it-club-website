<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\RolesEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Contact\UpdateContactStatusRequest;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends BaseApiController
{
    private const ADMIN_ROLES = [
        RolesEnum::ADMIN,
        RolesEnum::PRESIDENT,
        RolesEnum::VICE_PRESIDENT,
        RolesEnum::ACADEMIC_HEAD,
        RolesEnum::COMMUNICATIONS_HEAD,
        RolesEnum::VOLUNTEER_HEAD,
    ];

    private const ALLOWED_SORTS = [
        'id',
        'email',
        'full_name',
        'subject',
        'status',
        'created_at',
        'updated_at',
    ];

    private const ALLOWED_STATUSES = [
        'pending',
        'processing',
        'done',
    ];

    public function index(Request $request): JsonResponse
    {
        if ($response = $this->ensureAdminAccess($request)) {
            return $response;
        }

        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');
        $sort = (string) $request->query('sort', 'created_at');
        $order = strtolower((string) $request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));

        if (! in_array($sort, self::ALLOWED_SORTS, true)) {
            $sort = 'created_at';
        }

        $contacts = Contact::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, self::ALLOWED_STATUSES, true), function (Builder $query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy($sort, $order)
            ->paginate($perPage)
            ->through(fn (Contact $contact) => $this->transformContact($contact));

        return $this->paginatedResponse($contacts, 'Contacts retrieved successfully');
    }

    public function updateStatus(
        UpdateContactStatusRequest $request,
        Contact $contact
    ): JsonResponse {
        if ($response = $this->ensureAdminAccess($request)) {
            return $response;
        }

        $contact->status = $request->validated('status');
        $contact->updated_by = $request->user()?->id;
        $contact->updated_at = now();
        $contact->save();

        return $this->successResponse(
            true,
            $this->transformContact($contact->fresh()),
            'Contact status updated successfully'
        );
    }

    private function ensureAdminAccess(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return $this->unauthorizedResponse();
        }

        $roles = array_map(
            static fn (RolesEnum $role) => $role->value,
            self::ADMIN_ROLES
        );

        if (! $user->hasAnyRole($roles)) {
            return $this->forbiddenResponse();
        }

        return null;
    }

    private function transformContact(Contact $contact): array
    {
        return [
            'id' => $contact->id,
            'email' => $contact->email,
            'full_name' => $contact->full_name,
            'subject' => $contact->subject,
            'message' => $contact->message,
            'status' => $contact->status,
            'created_at' => $contact->created_at?->toISOString(),
            'updated_at' => $contact->updated_at?->toISOString(),
            'created_by' => $contact->created_by,
            'updated_by' => $contact->updated_by,
        ];
    }
}
