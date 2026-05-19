<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ClubInformation;

class ClubInformationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'value', 'label', 'slug', 'type', 'description', 'is_active', 'created_at', 'updated_at'];
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

    private function formatClubInformation(ClubInformation $clubInformation): array
    {
        return [
            'id' => $clubInformation->id,
            'value' => $clubInformation->value,
            'label' => $clubInformation->label,
            'slug' => $clubInformation->slug,
            'type' => $clubInformation->type,
            'description' => $clubInformation->description,
            'is_active' => (bool) $clubInformation->is_active,
            'created_at' => $this->formatDate($clubInformation->created_at),
            'updated_at' => $this->formatDate($clubInformation->updated_at),
            'club_information_values' => $clubInformation
                ->clubInformationValues
                ->map(fn ($value) => [
                    'id' => $value->id,
                    'club_information_id' => $value->club_information_id,
                    'value' => $value->value,
                    'is_active' => (bool) $value->is_active,
                    'created_at' => $this->formatDate($value->created_at),
                    'updated_at' => $this->formatDate($value->updated_at),
                ])
                ->values(),
        ];
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
