<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ClubInformation;
use App\Models\MailTemplate;
use App\Models\MailTemplateType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MailTemplateController extends BaseApiController
{
    // -------------------------------------------------------------------------
    // Mail template types
    // -------------------------------------------------------------------------

    public function index(): JsonResponse
    {
        $types = MailTemplateType::withCount([
            'mailTemplates' => fn ($q) => $q->whereNull('deleted_at'),
        ])
            ->orderBy('id')
            ->get()
            ->map(fn (MailTemplateType $type) => $this->formatType($type));

        return $this->successResponse(true, $types, 'Mail template types retrieved successfully');
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $allowedSorts = ['id', 'name', 'subject', 'is_default', 'created_at', 'updated_at'];
        $sort = in_array($request->query('sort'), $allowedSorts, true)
            ? $request->query('sort')
            : 'created_at';
        $order = in_array($request->query('order'), ['asc', 'desc'], true)
            ? $request->query('order')
            : 'desc';
        $perPage = (int) $request->query('per_page', 10);
        $search = trim((string) $request->query('search', ''));

        $type = MailTemplateType::findOrFail($id);

        $query = $type->mailTemplates()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $order);

        if ($perPage > 0) {
            $templates = $query->paginate($perPage)
                ->through(fn (MailTemplate $t) => $this->formatTemplate($t));

            return $this->paginatedResponse($templates, 'Retrieved successfully');
        }

        $templates = $query->get()->map(fn (MailTemplate $t) => $this->formatTemplate($t));

        return $this->successResponse(true, [
            'type' => $this->formatType($type),
            'templates' => $templates,
        ], 'Retrieved successfully');
    }

    // -------------------------------------------------------------------------
    // Templates CRUD
    // -------------------------------------------------------------------------

    public function storeTemplate(Request $request, int $typeId): JsonResponse
    {
        $type = MailTemplateType::findOrFail($typeId);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'subject'    => 'required|string|max:255',
            'body'       => 'required|string',
            'is_default' => 'sometimes|boolean',
        ]);

        $isDefault = (bool) ($validated['is_default'] ?? false);

        if (! $isDefault && ! $this->hasDefaultTemplate($type)) {
            return $this->validationErrorResponse([
                'is_default' => ['Loại mail phải có ít nhất một template mặc định.'],
            ]);
        }

        $template = DB::transaction(function () use ($request, $type, $validated, $isDefault) {
            if ($isDefault) {
                $this->deactivateSiblingTemplates($type);
            }

            return $type->mailTemplates()->create([
                'name'       => trim($validated['name']),
                'subject'    => trim($validated['subject']),
                'body'       => $validated['body'],
                'is_default' => $isDefault,
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]);
        });

        return $this->createdResponse(
            $this->formatTemplate($template),
            'Tạo template thành công.'
        );
    }

    public function updateTemplate(Request $request, int $typeId, int $templateId): JsonResponse
    {
        $type = MailTemplateType::findOrFail($typeId);
        $template = MailTemplate::where('mail_template_type_id', $type->id)
            ->findOrFail($templateId);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'subject'    => 'required|string|max:255',
            'body'       => 'required|string',
            'is_default' => 'sometimes|boolean',
        ]);

        $isDefault = array_key_exists('is_default', $validated)
            ? (bool) $validated['is_default']
            : $template->is_default;

        if (! $isDefault && ! $this->hasOtherDefaultTemplate($type, $template->id)) {
            return $this->validationErrorResponse([
                'is_default' => ['Loại mail phải có ít nhất một template mặc định.'],
            ]);
        }

        DB::transaction(function () use ($request, $type, $template, $validated, $isDefault) {
            if ($isDefault) {
                $this->deactivateSiblingTemplates($type, $template->id);
            }

            $template->update([
                'name'       => trim($validated['name']),
                'subject'    => trim($validated['subject']),
                'body'       => $validated['body'],
                'is_default' => $isDefault,
                'updated_by' => $request->user()?->id,
            ]);
        });

        return $this->successResponse(
            true,
            $this->formatTemplate($template->refresh()),
            'Cập nhật template thành công.'
        );
    }

    public function setDefaultTemplate(Request $request, int $typeId, int $templateId): JsonResponse
    {
        $type = MailTemplateType::findOrFail($typeId);
        $template = MailTemplate::where('mail_template_type_id', $type->id)
            ->findOrFail($templateId);

        DB::transaction(function () use ($request, $type, $template) {
            $this->deactivateSiblingTemplates($type, $template->id);

            $template->update([
                'is_default' => true,
                'updated_by' => $request->user()?->id,
            ]);
        });

        return $this->successResponse(
            true,
            $this->formatTemplate($template->refresh()),
            'Đặt template mặc định thành công.'
        );
    }

    public function destroyTemplate(int $typeId, int $templateId): JsonResponse
    {
        $type = MailTemplateType::findOrFail($typeId);
        $template = MailTemplate::where('mail_template_type_id', $type->id)
            ->findOrFail($templateId);

        if ($template->is_default) {
            return $this->validationErrorResponse([
                'mail_template' => ['Không thể xóa template đang là mặc định.'],
            ]);
        }

        $count = $type->mailTemplates()->count();
        if ($count <= 1) {
            return $this->validationErrorResponse([
                'mail_template' => ['Loại mail phải có ít nhất một template.'],
            ]);
        }

        $deletedId = $template->id;
        $template->delete();

        return $this->successResponse(true, ['id' => $deletedId], 'Xóa template thành công.');
    }

    // -------------------------------------------------------------------------
    // Auto-send email toggle
    // -------------------------------------------------------------------------

    public function getEmailNotificationSetting(): JsonResponse
    {
        $info = ClubInformation::where('slug', 'auto-send-mail-recruitment')->first();

        if (! $info) {
            return $this->successResponse(true, ['enabled' => false], 'Retrieved successfully');
        }

        $value = $info->clubInformationValues()
            ->where('is_active', true)
            ->value('value');

        return $this->successResponse(true, ['enabled' => $value === 'true'], 'Retrieved successfully');
    }

    public function toggleEmailNotification(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $info = ClubInformation::where('slug', 'auto-send-mail-recruitment')->first();

        if (! $info) {
            return $this->notFoundResponse('Cấu hình không tồn tại.');
        }

        $newValue = $validated['enabled'] ? 'true' : 'false';

        $info->clubInformationValues()
            ->where('is_active', true)
            ->update([
                'value'      => $newValue,
                'updated_by' => $request->user()?->id,
                'updated_at' => now(),
            ]);

        return $this->successResponse(
            true,
            ['enabled' => $validated['enabled']],
            'Cập nhật cài đặt thành công.'
        );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function formatType(MailTemplateType $type): array
    {
        return [
            'id'              => $type->id,
            'slug'            => $type->slug,
            'label'           => $type->label,
            'description'     => $type->description,
            'templates_count' => $type->mail_templates_count ?? $type->mailTemplates()->count(),
            'created_at'      => $this->formatDate($type->created_at),
            'updated_at'      => $this->formatDate($type->updated_at),
        ];
    }

    private function formatTemplate(MailTemplate $template): array
    {
        return [
            'id'                    => $template->id,
            'mail_template_type_id' => $template->mail_template_type_id,
            'name'                  => $template->name,
            'subject'               => $template->subject,
            'body'                  => $template->body,
            'is_default'            => (bool) $template->is_default,
            'created_at'            => $this->formatDate($template->created_at),
            'updated_at'            => $this->formatDate($template->updated_at),
        ];
    }

    private function deactivateSiblingTemplates(MailTemplateType $type, ?int $exceptId = null): void
    {
        $type->mailTemplates()
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->update(['is_default' => false]);
    }

    private function hasDefaultTemplate(MailTemplateType $type): bool
    {
        return $type->mailTemplates()->where('is_default', true)->exists();
    }

    private function hasOtherDefaultTemplate(MailTemplateType $type, int $exceptId): bool
    {
        return $type->mailTemplates()
            ->where('id', '!=', $exceptId)
            ->where('is_default', true)
            ->exists();
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
