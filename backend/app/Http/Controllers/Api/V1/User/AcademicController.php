<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Faculty;
use App\Models\Major;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicController extends BaseApiController
{
    public function faculties(): JsonResponse
    {
        $faculties = Faculty::query()
            ->orderBy('label')
            ->get(['id', 'value', 'label', 'slug']);

        return $this->successResponse(true, $faculties, 'Lấy danh sách khoa thành công.');
    }

    public function majors(Request $request): JsonResponse
    {
        $facultyId = $request->integer('faculty_id') ?: null;

        $majors = Major::query()
            ->when($facultyId, fn ($q) => $q->where('faculty_id', $facultyId))
            ->orderBy('label')
            ->get(['id', 'value', 'label', 'slug', 'faculty_id']);

        return $this->successResponse(true, $majors, 'Lấy danh sách ngành thành công.');
    }

    public function schoolClasses(Request $request): JsonResponse
    {
        $majorId = $request->integer('major_id') ?: null;

        $classes = SchoolClass::query()
            ->when($majorId, fn ($q) => $q->where('major_id', $majorId))
            ->orderBy('label')
            ->get(['id', 'value', 'label', 'slug', 'major_id']);

        return $this->successResponse(true, $classes, 'Lấy danh sách lớp thành công.');
    }
}
