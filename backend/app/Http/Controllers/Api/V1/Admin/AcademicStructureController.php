<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AcademicStructure\ImportAcademicStructureRequest;
use App\Services\AcademicStructureImportService;
use App\Support\Spreadsheet\SpreadsheetReader;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AcademicStructureController extends BaseApiController
{
    public function import(
        ImportAcademicStructureRequest $request,
        SpreadsheetReader $spreadsheetReader,
        AcademicStructureImportService $academicStructureImportService,
    ): JsonResponse {
        try {
            $rows = $spreadsheetReader->readRows($request->file('file'));
            $summary = $academicStructureImportService->import($rows);

            return $this->successResponse(
                true,
                $summary,
                'Import dữ liệu khoa, ngành, lớp thành công.',
            );
        } catch (RuntimeException $exception) {
            return $this->validationErrorResponse([
                'file' => [$exception->getMessage()],
            ]);
        }
    }
}
