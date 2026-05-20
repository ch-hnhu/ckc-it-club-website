<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AcademicStructure\ImportAcademicStructureRequest;
use App\Models\AcademicStructureImport;
use App\Services\AcademicStructureImportService;
use App\Support\Spreadsheet\SpreadsheetReader;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class AcademicStructureController extends BaseApiController
{
    private const ALLOWED_SORTS = [
        'id',
        'original_file_name',
        'file_type',
        'file_size_bytes',
        'status',
        'created_at',
        'uploaded_by_name',
    ];

    private const ALLOWED_STATUSES = [
        'completed',
        'failed',
    ];

    private const ALLOWED_TYPES = [
        'Excel',
        'CSV',
        'ZIP',
        'Other',
    ];

    private const SUPPORTED_IMPORT_EXTENSIONS = [
        'csv',
        'xlsx',
    ];

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');
        $type = (string) $request->query('type', '');
        $sort = (string) $request->query('sort', 'created_at');
        $order = strtolower((string) $request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));

        if (! in_array($sort, self::ALLOWED_SORTS, true)) {
            $sort = 'created_at';
        }

        $imports = AcademicStructureImport::query()
            ->leftJoin('users', 'users.id', '=', 'academic_structure_imports.uploaded_by')
            ->select('academic_structure_imports.*')
            ->with(['uploadedBy:id,full_name,email'])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('academic_structure_imports.original_file_name', 'like', "%{$search}%")
                        ->orWhere('academic_structure_imports.error_message', 'like', "%{$search}%")
                        ->orWhere('users.full_name', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, self::ALLOWED_STATUSES, true), function (Builder $query) use ($status) {
                $query->where('academic_structure_imports.status', $status);
            })
            ->when(in_array($type, self::ALLOWED_TYPES, true), function (Builder $query) use ($type) {
                $query->where('academic_structure_imports.file_type', $type);
            })
            ->when($sort === 'uploaded_by_name', function (Builder $query) use ($order) {
                $query->orderByRaw("COALESCE(users.full_name, users.email, '') {$order}");
            }, function (Builder $query) use ($sort, $order) {
                $query->orderBy("academic_structure_imports.{$sort}", $order);
            })
            ->paginate($perPage)
            ->through(fn (AcademicStructureImport $item) => $this->transformImport($item));

        return $this->paginatedResponse($imports, 'Import history retrieved successfully');
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total' => AcademicStructureImport::query()->count(),
            'completed' => AcademicStructureImport::query()->where('status', 'completed')->count(),
            'failed' => AcademicStructureImport::query()->where('status', 'failed')->count(),
            'with_errors' => AcademicStructureImport::query()->where('errors_count', '>', 0)->count(),
            'total_size_bytes' => (int) AcademicStructureImport::query()->sum('file_size_bytes'),
        ];

        return $this->successResponse(true, $stats, 'Import stats retrieved successfully');
    }

    public function import(
        ImportAcademicStructureRequest $request,
        SpreadsheetReader $spreadsheetReader,
        AcademicStructureImportService $academicStructureImportService,
    ): JsonResponse {
        $file = $request->file('file');

        Storage::disk('local')->makeDirectory('academic-structure-imports');
        $storedFilePath = $file?->store('academic-structure-imports', 'local');

        if ($file && $storedFilePath === false) {
            Log::warning('Academic structure import: failed to store file to local disk', [
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
        }

        try {
            $extension = strtolower((string) $file?->getClientOriginalExtension());

            if (! in_array($extension, self::SUPPORTED_IMPORT_EXTENSIONS, true)) {
                throw new RuntimeException('Chỉ hỗ trợ file .xlsx hoặc .csv.');
            }

            $rows = $spreadsheetReader->readRows($file);
            $summary = $academicStructureImportService->import($rows);

            $status = count($summary['errors'] ?? []) > 0 ? 'failed' : 'completed';
            $this->storeImportHistory($file, $storedFilePath, $request->user(), $status, $summary);

            return $this->successResponse(
                true,
                $summary,
                'Import dữ liệu khoa, ngành, lớp thành công.',
            );
        } catch (RuntimeException $exception) {
            $this->storeImportHistory(
                $file,
                $storedFilePath,
                $request->user(),
                'failed',
                null,
                $exception->getMessage(),
            );

            return $this->validationErrorResponse([
                'file' => [$exception->getMessage()],
            ]);
        } catch (Throwable $exception) {
            $this->storeImportHistory(
                $file,
                $storedFilePath,
                $request->user(),
                'failed',
                null,
                'Import dữ liệu thất bại.',
            );

            Log::error('Academic structure import failed', [
                'message' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return $this->errorResponse(false, 'Import dữ liệu thất bại.', 500);
        }
    }

    public function download(AcademicStructureImport $academicStructureImport): BinaryFileResponse|JsonResponse
    {
        if (
            ! $academicStructureImport->stored_file_path ||
            ! Storage::disk($academicStructureImport->storage_disk)->exists($academicStructureImport->stored_file_path)
        ) {
            return $this->notFoundResponse('Không tìm thấy file gốc.');
        }

        $fullPath = Storage::disk($academicStructureImport->storage_disk)
            ->path($academicStructureImport->stored_file_path);

        return response()->download($fullPath, $academicStructureImport->original_file_name);
    }

    /**
     * @param array<string, mixed>|null $summary
     */
    private function storeImportHistory(
        ?UploadedFile $file,
        string|false|null $storedFilePath,
        ?Authenticatable $user,
        string $status,
        ?array $summary = null,
        ?string $errorMessage = null,
    ): void {
        if (! $file) {
            return;
        }

        AcademicStructureImport::query()->create([
            'original_file_name' => $file->getClientOriginalName(),
            'stored_file_path' => $storedFilePath ?: null,
            'storage_disk' => 'local',
            'file_type' => $this->resolveFileType($file),
            'file_size_bytes' => $file->getSize() ?: 0,
            'uploaded_by' => $user?->getAuthIdentifier(),
            'status' => $status,
            'processed_rows' => (int) ($summary['processed_rows'] ?? 0),
            'created_faculties' => (int) ($summary['created']['faculties'] ?? 0),
            'created_majors' => (int) ($summary['created']['majors'] ?? 0),
            'created_school_classes' => (int) ($summary['created']['school_classes'] ?? 0),
            'existing_faculties' => (int) ($summary['existing']['faculties'] ?? 0),
            'existing_majors' => (int) ($summary['existing']['majors'] ?? 0),
            'existing_school_classes' => (int) ($summary['existing']['school_classes'] ?? 0),
            'errors_count' => count($summary['errors'] ?? []),
            'error_message' => $errorMessage,
            'error_details' => $summary['errors'] ?? null,
        ]);
    }

    private function resolveFileType(UploadedFile $file): string
    {
        return match (strtolower($file->getClientOriginalExtension())) {
            'csv' => 'CSV',
            'zip' => 'ZIP',
            'xlsx' => 'Excel',
            default => 'Other',
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function transformImport(AcademicStructureImport $item): array
    {
        $uploadedByName = $item->uploadedBy?->full_name
            ?: $item->uploadedBy?->email
            ?: 'Hệ thống';

        $description = $item->status === 'failed'
            ? ($item->error_message ?: 'Import thất bại, cần kiểm tra lại file.')
            : (
                $item->errors_count > 0
                    ? "Đã import {$item->processed_rows} dòng, có {$item->errors_count} dòng lỗi cần kiểm tra."
                    : "Đã import thành công {$item->processed_rows} dòng dữ liệu."
            );

        return [
            'id' => $item->id,
            'file_name' => $item->original_file_name,
            'file_type' => $item->file_type,
            'file_size_bytes' => $item->file_size_bytes,
            'uploaded_by_name' => $uploadedByName,
            'uploaded_at' => $item->created_at?->toISOString(),
            'status' => $item->status,
            'description' => $description,
            'processed_rows' => $item->processed_rows,
            'errors_count' => $item->errors_count,
            'error_message' => $item->error_message,
            'created_faculties' => $item->created_faculties,
            'created_majors' => $item->created_majors,
            'created_school_classes' => $item->created_school_classes,
            'existing_faculties' => $item->existing_faculties,
            'existing_majors' => $item->existing_majors,
            'existing_school_classes' => $item->existing_school_classes,
            'error_details' => $item->error_details,
        ];
    }
}
