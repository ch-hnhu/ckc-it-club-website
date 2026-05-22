<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ClubInformation\StoreClubInformationRequest;
use App\Http\Requests\Api\V1\ClubInformation\StoreClubInformationValueRequest;
use App\Http\Requests\Api\V1\ClubInformation\UpdateClubInformationRequest;
use App\Models\ClubInformation;
use App\Models\ClubInformationValue;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClubInformationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'value', 'label', 'slug', 'type', 'description', 'created_at', 'updated_at'];
        $sort = in_array($request->query('sort'), $allowedSorts, true)
            ? $request->query('sort')
            : 'created_at';
        $order = in_array($request->query('order'), ['asc', 'desc'], true)
            ? $request->query('order')
            : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');

        $query = ClubInformation::query()
            ->with('clubInformationValues')
            ->when($search, function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('value', 'like', "%{$search}%")
                        ->orWhere('label', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $order);

        if ($perPage > 0) {
            $data = $query
                ->paginate($perPage)
                ->through(fn (ClubInformation $clubInformation) => $this->formatClubInformation($clubInformation));

            return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
        }

        $data = $query
            ->get()
            ->map(fn (ClubInformation $clubInformation) => $this->formatClubInformation($clubInformation));

        return $this->successResponse(true, $data, ApiMessage::RETRIEVED);
    }

    public function store(StoreClubInformationRequest $request): JsonResponse
    {
        $clubInformation = DB::transaction(function () use ($request) {
            $clubInformation = ClubInformation::create([
                'label' => trim($request->string('label')->value()),
                'value' => trim($request->string('value')->value()),
                'slug' => trim($request->string('slug')->value()),
                'type' => $request->input('type'),
                'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]);

            $clubInformation->clubInformationValues()->create([
                'value' => $this->defaultValueForType($clubInformation->type),
                'link' => null,
                'alt' => null,
                'position' => null,
                'is_active' => true,
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]);

            return $clubInformation->load('clubInformationValues');
        });

        $admin = $request->user();
        NotificationService::dispatch(
            'Tạo cấu hình thông tin CLB',
            ($admin?->full_name ?? 'Admin').' đã tạo cấu hình "'.$clubInformation->label.'"',
            'created',
            'club_information',
            $clubInformation->id,
            $admin?->full_name ?? 'Admin',
            '/club-informations/'.$clubInformation->id,
        );

        return $this->createdResponse(
            $this->formatClubInformation($clubInformation),
            'Tạo cấu hình thành công.'
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $allowedValueSorts = ['id', 'value', 'alt', 'link', 'position', 'is_active', 'created_at', 'updated_at'];
        $valueSort = in_array($request->query('sort'), $allowedValueSorts, true)
            ? $request->query('sort')
            : 'created_at';
        $valueOrder = in_array($request->query('order'), ['asc', 'desc'], true)
            ? $request->query('order')
            : 'desc';
        $valueSearch = trim((string) $request->query('search', ''));

        $clubInformation = ClubInformation::with([
            'clubInformationValues' => function ($query) use ($valueSearch, $valueSort, $valueOrder) {
                $query
                    ->when($valueSearch !== '', function ($query) use ($valueSearch) {
                        $query->where(function ($subQuery) use ($valueSearch) {
                            $subQuery->where('value', 'like', "%{$valueSearch}%")
                                ->orWhere('alt', 'like', "%{$valueSearch}%");

                            if (ctype_digit($valueSearch)) {
                                $subQuery->orWhere('id', (int) $valueSearch);
                            }
                        });
                    })
                    ->orderBy($valueSort, $valueOrder);
            },
        ])->findOrFail($id);

        return $this->successResponse(true, $this->formatClubInformation($clubInformation), ApiMessage::RETRIEVED);
    }

    public function update(
        UpdateClubInformationRequest $request,
        ClubInformation $clubInformation
    ): JsonResponse {
        $clubInformation->update([
            'slug' => trim($request->string('slug')->value()),
            'description' => $request->filled('description') ? trim($request->string('description')->value()) : null,
            'updated_by' => $request->user()?->id,
        ]);

        $clubInformation->load('clubInformationValues');

        $admin = $request->user();
        NotificationService::dispatch(
            'Cập nhật cấu hình thông tin CLB',
            ($admin?->full_name ?? 'Admin').' đã cập nhật cấu hình "'.$clubInformation->label.'"',
            'updated',
            'club_information',
            $clubInformation->id,
            $admin?->full_name ?? 'Admin',
            '/club-informations/'.$clubInformation->id,
        );

        return $this->successResponse(
            true,
            $this->formatClubInformation($clubInformation),
            'Cập nhật cấu hình thành công.'
        );
    }

    public function storeValue(
        StoreClubInformationValueRequest $request,
        ClubInformation $clubInformation
    ): JsonResponse {
        $isActive = $request->boolean('is_active', true);

        if (! $isActive && ! $this->hasActiveValue($clubInformation)) {
            return $this->validationErrorResponse([
                'is_active' => ['Cấu hình phải có ít nhất một giá trị mặc định.'],
            ]);
        }

        $value = DB::transaction(function () use ($request, $clubInformation, $isActive) {
            if ($isActive) {
                $this->deactivateSiblingValues($clubInformation);
            }

            return $clubInformation->clubInformationValues()->create([
                'value' => trim($request->string('value')->value()),
                'link' => $request->filled('link') ? trim($request->string('link')->value()) : null,
                'alt' => $request->filled('alt') ? trim($request->string('alt')->value()) : null,
                'position' => $request->filled('position') ? (int) $request->input('position') : null,
                'is_active' => $isActive,
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]);
        });

        $admin = $request->user();
        NotificationService::dispatch(
            'Thêm giá trị cấu hình CLB',
            ($admin?->full_name ?? 'Admin').' đã thêm giá trị cho cấu hình "'.$clubInformation->label.'"',
            'created',
            'club_information_value',
            $value->id,
            $admin?->full_name ?? 'Admin',
            '/club-informations/'.$clubInformation->id,
        );

        return $this->createdResponse(
            $this->formatClubInformationValue($value),
            'Tạo giá trị cấu hình thành công.'
        );
    }

    public function updateValue(
        StoreClubInformationValueRequest $request,
        ClubInformation $clubInformation,
        ClubInformationValue $clubInformationValue
    ): JsonResponse {
        if ($clubInformationValue->club_information_id !== $clubInformation->id) {
            return $this->notFoundResponse('Giá trị cấu hình không tồn tại.');
        }

        $isActive = $request->boolean('is_active', true);

        if (! $isActive && ! $this->hasOtherActiveValue($clubInformation, $clubInformationValue->id)) {
            return $this->validationErrorResponse([
                'is_active' => ['Cấu hình phải có ít nhất một giá trị mặc định.'],
            ]);
        }

        DB::transaction(function () use ($request, $clubInformation, $clubInformationValue, $isActive) {
            if ($isActive) {
                $this->deactivateSiblingValues($clubInformation, $clubInformationValue->id);
            }

            $clubInformationValue->update([
                'value' => trim($request->string('value')->value()),
                'link' => $request->filled('link') ? trim($request->string('link')->value()) : null,
                'alt' => $request->filled('alt') ? trim($request->string('alt')->value()) : null,
                'position' => $request->filled('position') ? (int) $request->input('position') : null,
                'is_active' => $isActive,
                'updated_by' => $request->user()?->id,
            ]);
        });

        $admin = $request->user();
        NotificationService::dispatch(
            'Cập nhật giá trị cấu hình CLB',
            ($admin?->full_name ?? 'Admin').' đã cập nhật giá trị cho cấu hình "'.$clubInformation->label.'"',
            'updated',
            'club_information_value',
            $clubInformationValue->id,
            $admin?->full_name ?? 'Admin',
            '/club-informations/'.$clubInformation->id,
        );

        return $this->successResponse(
            true,
            $this->formatClubInformationValue($clubInformationValue),
            'Cập nhật giá trị cấu hình thành công.'
        );
    }

    public function destroyValue(
        ClubInformation $clubInformation,
        ClubInformationValue $clubInformationValue
    ): JsonResponse {
        if ($clubInformationValue->club_information_id !== $clubInformation->id) {
            return $this->notFoundResponse('Giá trị cấu hình không tồn tại.');
        }

        if ($clubInformationValue->is_active) {
            return $this->validationErrorResponse([
                'club_information_value' => ['Không thể xóa giá trị đang là mặc định của cấu hình.'],
            ]);
        }

        if ($clubInformation->clubInformationValues()->count() <= 1) {
            return $this->validationErrorResponse([
                'club_information_value' => ['Cấu hình phải có ít nhất một giá trị.'],
            ]);
        }

        $deletedId = $clubInformationValue->id;
        $clubInformationValue->delete();

        return $this->successResponse(
            true,
            ['id' => $deletedId],
            'Xóa giá trị cấu hình thành công.'
        );
    }

    private function formatClubInformation(ClubInformation $clubInformation): array
    {
        return [
            'id' => $clubInformation->id,
            'value' => $clubInformation->value,
            'label' => $clubInformation->label,
            'slug' => $clubInformation->slug,
            'type' => $clubInformation->type,
            'description' => $clubInformation->description,
            'created_at' => $this->formatDate($clubInformation->created_at),
            'updated_at' => $this->formatDate($clubInformation->updated_at),
            'club_information_values' => $clubInformation
                ->clubInformationValues
                ->map(fn (ClubInformationValue $value) => $this->formatClubInformationValue($value))
                ->values(),
            'resolved_club_information_values' => $this->resolveClubInformationValues($clubInformation)
                ->map(fn (ClubInformationValue $value) => $this->formatClubInformationValue($value))
                ->values(),
        ];
    }

    private function formatClubInformationValue(ClubInformationValue $value): array
    {
        return [
            'id' => $value->id,
            'club_information_id' => $value->club_information_id,
            'value' => $value->value,
            'link' => $value->link,
            'alt' => $value->alt,
            'position' => $value->position,
            'is_active' => (bool) $value->is_active,
            'created_at' => $this->formatDate($value->created_at),
            'updated_at' => $this->formatDate($value->updated_at),
        ];
    }

    private function deactivateSiblingValues(ClubInformation $clubInformation, ?int $exceptId = null): void
    {
        if ($clubInformation->type === 'banner') {
            return;
        }

        $clubInformation->clubInformationValues()
            ->when($exceptId, fn ($query) => $query->where('id', '!=', $exceptId))
            ->update(['is_active' => false]);
    }

    private function resolveClubInformationValues(ClubInformation $clubInformation)
    {
        $values = $clubInformation->clubInformationValues()
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return $values
            ->where('is_active', true)
            ->values();
    }

    private function hasActiveValue(ClubInformation $clubInformation): bool
    {
        return $clubInformation->clubInformationValues()
            ->where('is_active', true)
            ->exists();
    }

    private function hasOtherActiveValue(ClubInformation $clubInformation, int $exceptId): bool
    {
        return $clubInformation->clubInformationValues()
            ->where('id', '!=', $exceptId)
            ->where('is_active', true)
            ->exists();
    }

    private function defaultValueForType(?string $type): string
    {
        return $type === 'boolean' ? 'false' : '';
    }

    private function formatDate($value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d/m/Y');
        }

        return (string) $value;
    }
}
