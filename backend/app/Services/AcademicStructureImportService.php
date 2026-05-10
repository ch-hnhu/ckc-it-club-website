<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\Major;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AcademicStructureImportService
{
    /**
     * @param array<int, array<string, string|null>> $rows
     * @return array<string, mixed>
     */
    public function import(array $rows): array
    {
        $summary = [
            'processed_rows' => 0,
            'created' => [
                'faculties' => 0,
                'majors' => 0,
                'school_classes' => 0,
            ],
            'existing' => [
                'faculties' => 0,
                'majors' => 0,
                'school_classes' => 0,
            ],
            'errors' => [],
        ];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            try {
                $this->importRow($row, $summary);
                $summary['processed_rows']++;
            } catch (\Throwable $exception) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => $exception->getMessage(),
                ];
            }
        }

        return $summary;
    }

    /**
     * @param array<string, string|null> $row
     * @param array<string, mixed> $summary
     */
    private function importRow(array $row, array &$summary): void
    {
        $facultyPayload = $this->extractEntityPayload($row, 'faculty', [
            'faculty',
            'khoa',
            'faculty_code',
            'ma_khoa',
            'faculty_name',
            'ten_khoa',
        ]);
        $majorPayload = $this->extractEntityPayload($row, 'major', [
            'major',
            'nganh',
            'major_code',
            'ma_nganh',
            'major_name',
            'ten_nganh',
        ]);
        $classPayload = $this->extractEntityPayload($row, 'class', [
            'class',
            'lop',
            'class_code',
            'ma_lop',
            'class_name',
            'ten_lop',
        ]);

        if (! $facultyPayload && ! $majorPayload && ! $classPayload) {
            throw new RuntimeException('Dòng dữ liệu không chứa khoa, ngành hoặc lớp.');
        }

        if ($majorPayload && ! $facultyPayload) {
            throw new RuntimeException('Dòng có ngành nhưng thiếu thông tin khoa.');
        }

        if ($classPayload && ! $majorPayload) {
            throw new RuntimeException('Dòng có lớp nhưng thiếu thông tin ngành.');
        }

        DB::transaction(function () use ($facultyPayload, $majorPayload, $classPayload, &$summary): void {
            $faculty = null;
            $major = null;

            if ($facultyPayload) {
                [$faculty, $wasCreated] = $this->resolveFaculty($facultyPayload);
                $summary[$wasCreated ? 'created' : 'existing']['faculties']++;
            }

            if ($majorPayload && $faculty) {
                [$major, $wasCreated] = $this->resolveMajor($majorPayload, $faculty->id);
                $summary[$wasCreated ? 'created' : 'existing']['majors']++;
            }

            if ($classPayload && $major) {
                [, $wasCreated] = $this->resolveSchoolClass($classPayload, $major->id);
                $summary[$wasCreated ? 'created' : 'existing']['school_classes']++;
            }
        });
    }

    /**
     * @param array<string, string|null> $row
     * @param array<int, string> $fallbackKeys
     * @return array{value: string, label: string, slug: string}|null
     */
    private function extractEntityPayload(array $row, string $prefix, array $fallbackKeys): ?array
    {
        $value = $this->firstNonEmptyValue($row, [
            "{$prefix}_value",
            ...$fallbackKeys,
        ]);
        $label = $this->firstNonEmptyValue($row, [
            "{$prefix}_label",
            "{$prefix}_name",
            ...$fallbackKeys,
        ]);

        if ($value === null && $label === null) {
            return null;
        }

        $resolvedValue = $value ?? $label;
        $resolvedLabel = $label ?? $value;

        if ($resolvedValue === null || $resolvedLabel === null) {
            return null;
        }

        $slug = Str::slug($resolvedLabel) ?: Str::slug($resolvedValue);

        if ($slug === '') {
            throw new RuntimeException("Không thể tạo slug cho {$prefix}.");
        }

        return [
            'value' => $resolvedValue,
            'label' => $resolvedLabel,
            'slug' => $slug,
        ];
    }

    /**
     * @param array<string, string|null> $payload
     * @return array{0: Faculty, 1: bool}
     */
    private function resolveFaculty(array $payload): array
    {
        $faculty = Faculty::query()->firstOrCreate(
            ['slug' => $payload['slug']],
            $payload,
        );

        return [$faculty, $faculty->wasRecentlyCreated];
    }

    /**
     * @param array<string, string|null> $payload
     * @return array{0: Major, 1: bool}
     */
    private function resolveMajor(array $payload, int $facultyId): array
    {
        $major = Major::query()->firstOrCreate(
            [
                'faculty_id' => $facultyId,
                'slug' => $payload['slug'],
            ],
            [
                ...$payload,
                'faculty_id' => $facultyId,
            ],
        );

        return [$major, $major->wasRecentlyCreated];
    }

    /**
     * @param array<string, string|null> $payload
     * @return array{0: SchoolClass, 1: bool}
     */
    private function resolveSchoolClass(array $payload, int $majorId): array
    {
        $schoolClass = SchoolClass::query()->firstOrCreate(
            [
                'major_id' => $majorId,
                'slug' => $payload['slug'],
            ],
            [
                ...$payload,
                'major_id' => $majorId,
            ],
        );

        return [$schoolClass, $schoolClass->wasRecentlyCreated];
    }

    /**
     * @param array<string, string|null> $row
     * @param array<int, string> $keys
     */
    private function firstNonEmptyValue(array $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $row[$key] ?? null;

            if (! is_string($value)) {
                continue;
            }

            $trimmedValue = trim($value);

            if ($trimmedValue !== '') {
                return $trimmedValue;
            }
        }

        return null;
    }
}
