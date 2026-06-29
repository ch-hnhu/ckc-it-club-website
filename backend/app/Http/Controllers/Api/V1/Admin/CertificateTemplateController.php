<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\CertificateTemplate;
use App\Models\User;
use App\Services\CertificateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
     * Chi tiết một mẫu — trả full `design` để editor nạp lại canvas.
     */
    public function show(CertificateTemplate $certificateTemplate): JsonResponse
    {
        $certificateTemplate->load('creator:id,full_name,avatar');

        return $this->successResponse(true, $this->transformDetail($certificateTemplate), ApiMessage::RETRIEVED);
    }

    /**
     * Tạo mẫu mới từ thiết kế canvas của editor.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $template = CertificateTemplate::create([
            'name' => $data['name'],
            // Dùng input() (không phải mảng validated đã bị lược các key không có rule như canvas.background)
            'design' => $request->input('design'),
            'is_default' => false,
            'created_by' => $request->user()->id,
        ]);

        $this->generateThumbnail($template);

        return $this->createdResponse($this->transformDetail($template->refresh()), 'Tạo mẫu chứng chỉ thành công.');
    }

    /**
     * Cập nhật thiết kế / tên / thumbnail của một mẫu.
     */
    public function update(Request $request, CertificateTemplate $certificateTemplate): JsonResponse
    {
        $data = $this->validatePayload($request);

        $certificateTemplate->update([
            'name' => $data['name'],
            'design' => $request->input('design'),
        ]);

        // Render lại thumbnail theo thiết kế mới.
        $this->generateThumbnail($certificateTemplate);

        return $this->successResponse(true, $this->transformDetail($certificateTemplate->refresh()), 'Đã cập nhật mẫu chứng chỉ.');
    }

    /**
     * Xoá mẫu. course_certificates.template_id đã nullOnDelete nên cert đã cấp vẫn giữ.
     */
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
    public function duplicate(Request $request, CertificateTemplate $certificateTemplate): JsonResponse
    {
        $clone = CertificateTemplate::create([
            'name' => $certificateTemplate->name.' (sao chép)',
            'design' => $certificateTemplate->design,
            'html_content' => $certificateTemplate->html_content,
            'thumbnail' => $this->copyFile($certificateTemplate->thumbnail),
            'is_default' => false,
            'created_by' => $request->user()->id,
        ]);

        return $this->createdResponse($this->transformDetail($clone), 'Đã nhân bản mẫu chứng chỉ.');
    }

    /**
     * Upload ảnh nền / logo cho editor — trả về URL công khai để gắn vào `design`.
     */
    public function uploadAsset(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        $path = $request->file('image')->store('certificate-assets', 'public');

        return $this->successResponse(true, ['url' => $this->resolveUrl($path)], 'Tải ảnh lên thành công.');
    }

    /**
     * Render thử PDF với dữ liệu mẫu từ thiết kế đang soạn (chưa cần lưu) — cho nút "Xem trước".
     */
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
            $path = 'certificate-thumbnails/'.Str::uuid()->toString().'.png';
            Storage::disk('public')->put($path, $png);

            $this->deleteFile($template->thumbnail);
            $template->update(['thumbnail' => $path]);
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
        if ($path && ! Str::startsWith($path, ['http://', 'https://', '/'])) {
            Storage::disk('public')->delete($path);
        }
    }

    private function copyFile(?string $path): ?string
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $copy = 'certificate-thumbnails/'.Str::uuid()->toString().'.'.pathinfo($path, PATHINFO_EXTENSION);
        Storage::disk('public')->copy($path, $copy);

        return $copy;
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
            'design' => $template->design,
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
