<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\CertificateTemplate;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateTemplateController extends BaseApiController
{
    /**
     * Danh sách mẫu chứng chỉ cho trang quản trị "Trung tâm đào tạo".
     * Hỗ trợ phân trang, tìm kiếm theo tên và sắp xếp theo từng cột.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $search = $request->query('search');

        $sortable = ['id', 'name', 'is_default', 'created_at', 'creator'];
        $sort = in_array($request->query('sort'), $sortable, true) ? $request->query('sort') : 'created_at';
        $order = $request->query('order') === 'asc' ? 'asc' : 'desc';

        $templates = CertificateTemplate::query()
            ->with('creator:id,full_name,avatar')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when(
                $sort === 'creator',
                fn ($q) => $q->orderBy(
                    User::select('full_name')->whereColumn('users.id', 'certificate_templates.created_by'),
                    $order,
                ),
                fn ($q) => $q->orderBy($sort, $order),
            )
            ->paginate($perPage);

        $templates->getCollection()->transform(fn (CertificateTemplate $t) => $this->transformTemplate($t));

        return $this->paginatedResponse($templates, ApiMessage::RETRIEVED);
    }

    /**
     * Chuẩn hoá một mẫu chứng chỉ thành shape mà admin frontend dùng.
     */
    private function transformTemplate(CertificateTemplate $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'thumbnail' => $this->resolveUrl($template->thumbnail),
            'is_default' => (bool) $template->is_default,
            'creator' => $template->creator ? [
                'id' => $template->creator->id,
                'full_name' => $template->creator->full_name,
                'avatar' => $this->resolveUrl($template->creator->avatar),
            ] : null,
            'created_at' => $template->created_at?->toIso8601String(),
            'updated_at' => $template->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Trả về URL công khai cho path lưu trên disk public (hoặc giữ nguyên nếu đã là URL).
     */
    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
