<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\CertificateTemplate;
use App\Models\User;
use App\Services\CertificateRenderer;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class CertificateTemplateController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}

    #[OA\Get(
        path: '/v1/certificate-templates',
        summary: '[Admin] Danh sách mẫu chứng chỉ',
        description: 'Yêu cầu quyền courses.view.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 10, maximum: 50)),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'order', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công (phân trang)', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
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
     * Chi tiết một mẫu — trả full `design` để editor nạp lại canvas.
     */
    #[OA\Get(
        path: '/v1/certificate-templates/{certificateTemplate}',
        summary: '[Admin] Chi tiết một mẫu chứng chỉ (kèm design đầy đủ để nạp lại canvas)',
        description: 'Yêu cầu quyền courses.view.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'certificateTemplate', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Không tìm thấy', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function show(CertificateTemplate $certificateTemplate): JsonResponse
    {
        $certificateTemplate->load('creator:id,full_name,avatar');

        return $this->successResponse(true, $this->transformDetail($certificateTemplate), ApiMessage::RETRIEVED);
    }

    /**
     * Tạo mẫu mới từ thiết kế canvas của editor.
     */
    #[OA\Post(
        path: '/v1/certificate-templates',
        summary: '[Admin] Tạo mẫu chứng chỉ mới từ thiết kế canvas của editor',
        description: 'Yêu cầu quyền courses.manage. Tự động render thumbnail server-side sau khi tạo.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['name', 'design'], properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 255),
                new OA\Property(property: 'design', properties: [
                    new OA\Property(property: 'canvas', properties: [
                        new OA\Property(property: 'width', type: 'number'),
                        new OA\Property(property: 'height', type: 'number'),
                    ], type: 'object'),
                    new OA\Property(property: 'elements', type: 'array', items: new OA\Items(type: 'object')),
                ], type: 'object'),
            ])
        ),
        responses: [
            new OA\Response(response: 201, description: 'Tạo thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $template = CertificateTemplate::create([
            'name' => $data['name'],
            // Dùng input() (không phải mảng validated đã bị lược các key không có rule như canvas.background)
            'design' => $this->normalizeDesignForStorage($request->input('design')),
            'is_default' => false,
            'created_by' => $request->user()->id,
        ]);

        $this->generateThumbnail($template);

        return $this->createdResponse($this->transformDetail($template->refresh()), 'Tạo mẫu chứng chỉ thành công.');
    }

    /**
     * Cập nhật thiết kế / tên / thumbnail của một mẫu.
     */
    #[OA\Put(
        path: '/v1/certificate-templates/{certificateTemplate}',
        summary: '[Admin] Cập nhật thiết kế / tên của một mẫu chứng chỉ',
        description: 'Yêu cầu quyền courses.manage. Render lại thumbnail theo thiết kế mới.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'certificateTemplate', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['name', 'design'], properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 255),
                new OA\Property(property: 'design', properties: [
                    new OA\Property(property: 'canvas', properties: [
                        new OA\Property(property: 'width', type: 'number'),
                        new OA\Property(property: 'height', type: 'number'),
                    ], type: 'object'),
                    new OA\Property(property: 'elements', type: 'array', items: new OA\Items(type: 'object')),
                ], type: 'object'),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Cập nhật thành công', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function update(Request $request, CertificateTemplate $certificateTemplate): JsonResponse
    {
        $data = $this->validatePayload($request);

        $certificateTemplate->update([
            'name' => $data['name'],
            'design' => $this->normalizeDesignForStorage($request->input('design')),
        ]);

        // Render lại thumbnail theo thiết kế mới.
        $this->generateThumbnail($certificateTemplate);

        return $this->successResponse(true, $this->transformDetail($certificateTemplate->refresh()), 'Đã cập nhật mẫu chứng chỉ.');
    }

    /**
     * Xoá mẫu. course_certificates.template_id đã nullOnDelete nên cert đã cấp vẫn giữ.
     */
    #[OA\Delete(
        path: '/v1/certificate-templates/{certificateTemplate}',
        summary: '[Admin] Xoá mẫu chứng chỉ',
        description: 'Yêu cầu quyền courses.manage. Không thể xoá mẫu đang đặt mặc định. Chứng chỉ đã cấp vẫn được giữ (template_id → null).',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'certificateTemplate', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Đã xoá', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Đang là mẫu mặc định, không thể xoá', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function destroy(CertificateTemplate $certificateTemplate): JsonResponse
    {
        abort_if($certificateTemplate->is_default, 422, 'Không thể xoá mẫu đang đặt mặc định. Hãy đặt mẫu khác làm mặc định trước.');

        $this->deleteFile($certificateTemplate->thumbnail);
        $certificateTemplate->delete();

        return $this->successResponse(true, null, 'Đã xoá mẫu chứng chỉ.');
    }

    /**
     * Đặt mẫu này làm mặc định (gỡ mặc định các mẫu khác).
     */
    #[OA\Post(
        path: '/v1/certificate-templates/{certificateTemplate}/default',
        summary: '[Admin] Đặt mẫu này làm mặc định (gỡ mặc định các mẫu khác)',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'certificateTemplate', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Đã đặt làm mặc định', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
    public function setDefault(CertificateTemplate $certificateTemplate): JsonResponse
    {
        DB::transaction(function () use ($certificateTemplate) {
            CertificateTemplate::where('is_default', true)
                ->where('id', '!=', $certificateTemplate->id)
                ->update(['is_default' => false]);
            $certificateTemplate->update(['is_default' => true]);
        });

        return $this->successResponse(true, $this->transformTemplate($certificateTemplate->refresh()), 'Đã đặt làm mẫu mặc định.');
    }

    /**
     * Nhân bản mẫu (design + thumbnail), không kế thừa trạng thái mặc định.
     */
    #[OA\Post(
        path: '/v1/certificate-templates/{certificateTemplate}/duplicate',
        summary: '[Admin] Nhân bản mẫu chứng chỉ (design + thumbnail), không kế thừa trạng thái mặc định',
        description: 'Yêu cầu quyền courses.manage.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        parameters: [
            new OA\Parameter(name: 'certificateTemplate', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 201, description: 'Đã nhân bản', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
        ]
    )]
    public function duplicate(Request $request, CertificateTemplate $certificateTemplate): JsonResponse
    {
        $clone = CertificateTemplate::create([
            'name' => $certificateTemplate->name.' (sao chép)',
            'design' => $certificateTemplate->design,
            'thumbnail' => $this->copyFile($certificateTemplate->thumbnail),
            'is_default' => false,
            'created_by' => $request->user()->id,
        ]);

        return $this->createdResponse($this->transformDetail($clone), 'Đã nhân bản mẫu chứng chỉ.');
    }

    /**
     * Upload ảnh nền / logo cho editor — trả về URL công khai để gắn vào `design`.
     */
    #[OA\Post(
        path: '/v1/certificate-templates/assets',
        summary: '[Admin] Upload ảnh nền / logo cho editor mẫu chứng chỉ',
        description: 'Yêu cầu quyền courses.manage. Trả về URL công khai để gắn vào design.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(required: ['image'], properties: [
                    new OA\Property(property: 'image', type: 'string', format: 'binary', description: 'Ảnh, tối đa 5MB'),
                ])
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Tải ảnh lên thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'url', type: 'string'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function uploadAsset(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        $url = $this->storage->uploadImage($request->file('image'), 'certificate');

        return $this->successResponse(true, ['url' => $url], 'Tải ảnh lên thành công.');
    }

    /**
     * Render thử PDF với dữ liệu mẫu từ thiết kế đang soạn (chưa cần lưu) — cho nút "Xem trước".
     */
    #[OA\Post(
        path: '/v1/certificate-templates/preview',
        summary: '[Admin] Render thử PDF với dữ liệu mẫu từ thiết kế đang soạn (chưa cần lưu)',
        description: 'Yêu cầu quyền courses.manage. Dùng cho nút "Xem trước" trong editor.',
        security: [['sanctum' => []]],
        tags: ['Learning - Courses (Admin)'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['design'], properties: [
                new OA\Property(property: 'design', properties: [
                    new OA\Property(property: 'canvas', type: 'object'),
                    new OA\Property(property: 'elements', type: 'array', items: new OA\Items(type: 'object')),
                ], type: 'object'),
            ])
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Thành công',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'pdf', type: 'string', description: 'Data URI base64 của PDF (data:application/pdf;base64,...)'),
                    ], type: 'object'),
                ])
            ),
            new OA\Response(response: 422, description: 'Lỗi validate', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function preview(Request $request, CertificateRenderer $renderer): JsonResponse
    {
        $request->validate([
            'design' => 'required|array',
            'design.canvas' => 'required|array',
        ]);

        $template = new CertificateTemplate(['design' => $request->input('design')]);
        $pdf = $renderer->renderPdf($template, $this->sampleData());

        return $this->successResponse(
            true,
            ['pdf' => 'data:application/pdf;base64,'.base64_encode($pdf)],
            ApiMessage::RETRIEVED,
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * @return array{name:string,design:array}
     */
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'design' => 'required|array',
            'design.canvas' => 'required|array',
            'design.canvas.width' => 'required|numeric|min:1',
            'design.canvas.height' => 'required|numeric|min:1',
            'design.elements' => 'present|array',
        ]);
    }

    /**
     * Sinh thumbnail server-side từ chính bản render (Browsershot chụp PNG) để khớp đúng thiết kế.
     * Xoá thumbnail cũ (nếu có) rồi cập nhật path mới. Không làm hỏng request nếu render lỗi.
     */
    private function generateThumbnail(CertificateTemplate $template): void
    {
        if (empty($template->design)) {
            return;
        }

        try {
            $png = app(CertificateRenderer::class)->renderThumbnail($template, $this->sampleData());
            $filename = Str::uuid()->toString().'.png';
            $url = $this->storage->uploadRaw($png, 'certificate', $filename, 'image/png', 'images');

            $this->deleteFile($template->thumbnail);
            $template->update(['thumbnail' => $url]);
        } catch (\Throwable $e) {
            report($e); // thumbnail là phụ — không chặn lưu mẫu
        }
    }

    /**
     * Dữ liệu mẫu để render preview/thumbnail (chung cho cả preview()).
     *
     * @return array<string,string>
     */
    private function sampleData(): array
    {
        $code = 'CKC-2026-PREVIEW01';

        return [
            'name' => 'Nguyễn Văn Mẫu',
            'course' => 'Khoá học mẫu',
            'cert_code' => $code,
            'issued_at' => now()->format('d/m/Y'),
            'track' => 'Offline',
            'verify_url' => rtrim((string) config('app.url'), '/').'/verify/'.$code,
        ];
    }

    private function deleteFile(?string $path): void
    {
        // Only attempt deletion for Supabase-hosted URLs.
        // Non-Supabase or null values are safely ignored by the service.
        if ($path) {
            $this->storage->delete($path);
        }
    }

    private function copyFile(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        // Download from Supabase (or any URL) and re-upload as a new file.
        $verifySsl = filter_var(env('HTTP_VERIFY_SSL', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
        $response = Http::withOptions(['verify' => $verifySsl])->timeout(30)->get($url);
        if (! $response->successful()) {
            return null;
        }

        $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'png';
        $filename = Str::uuid()->toString().'.'.$ext;
        $mimeType = $response->header('Content-Type') ?: 'image/png';

        try {
            return $this->storage->uploadRaw($response->body(), 'certificate', $filename, $mimeType, 'images');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Shape rút gọn cho danh sách (không kèm design).
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
     * Shape đầy đủ (kèm `design`) cho editor.
     */
    private function transformDetail(CertificateTemplate $template): array
    {
        return [
            ...$this->transformTemplate($template),
            'design' => $this->resolveDesignForClient($template->design),
        ];
    }

    /**
     * Trả về URL công khai cho path lưu trên disk public (hoặc giữ nguyên nếu đã là URL).
     */
    private function resolveUrl(?string $path): ?string
    {
        // DB now stores the full public URL after migration.
        // Legacy /storage/ paths are resolved to backend absolute URLs for client compatibility.
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, '/storage/')) {
            return rtrim((string) config('app.url'), '/').$path;
        }

        // Already a full URL (Supabase https://... or external)
        return $path;
    }

    /**
     * Editor chạy ở port frontend nên asset /storage phải được trả về URL backend tuyệt đối.
     *
     * @param  array<string,mixed>|null  $design
     * @return array<string,mixed>|null
     */
    private function resolveDesignForClient(?array $design): ?array
    {
        if (! $design) {
            return $design;
        }

        if (! empty($design['canvas']['background']['image']) && is_string($design['canvas']['background']['image'])) {
            $design['canvas']['background']['image'] = $this->resolveUrl($design['canvas']['background']['image']);
        }

        foreach (($design['elements'] ?? []) as $idx => $element) {
            if (
                is_array($element)
                && ($element['type'] ?? null) === 'image'
                && ! empty($element['src'])
                && is_string($element['src'])
            ) {
                $design['elements'][$idx]['src'] = $this->resolveUrl($element['src']);
            }
        }

        return $design;
    }

    /**
     * DB chỉ lưu path ổn định để seed/export không bị dính host local.
     *
     * @param  array<string,mixed>  $design
     * @return array<string,mixed>
     */
    private function normalizeDesignForStorage(array $design): array
    {
        if (! empty($design['canvas']['background']['image']) && is_string($design['canvas']['background']['image'])) {
            $design['canvas']['background']['image'] = $this->normalizePublicStorageUrl($design['canvas']['background']['image']);
        }

        foreach (($design['elements'] ?? []) as $idx => $element) {
            if (
                is_array($element)
                && ($element['type'] ?? null) === 'image'
                && ! empty($element['src'])
                && is_string($element['src'])
            ) {
                $design['elements'][$idx]['src'] = $this->normalizePublicStorageUrl($element['src']);
            }
        }

        return $design;
    }

    private function normalizePublicStorageUrl(string $url): string
    {
        $appUrl = rtrim((string) config('app.url'), '/');
        if ($appUrl !== '' && str_starts_with($url, $appUrl.'/storage/')) {
            return substr($url, strlen($appUrl));
        }

        return $url;
    }
}
