<?php

namespace App\Support\Spreadsheet;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class SpreadsheetReader
{
    /**
     * @return array<int, array<string, string|null>>
     */
    public function readRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        if (! $path) {
            throw new RuntimeException('Không thể đọc file đã tải lên.');
        }

        return match ($extension) {
            'csv', 'txt' => $this->readCsv($path),
            'xlsx' => $this->readXlsx($path),
            default => throw new RuntimeException('Định dạng file không được hỗ trợ.'),
        };
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function readCsv(string $path): array
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw new RuntimeException('Không thể mở file CSV.');
        }

        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = array_map(
                static fn ($value) => is_string($value) ? trim($value) : $value,
                $row,
            );
        }

        fclose($handle);

        return $this->mapRowsToAssociative($rows);
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function readXlsx(string $path): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('Máy chủ chưa bật ZipArchive để đọc file .xlsx.');
        }

        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new RuntimeException('Không thể mở file .xlsx.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $worksheetPath = $this->resolveFirstWorksheetPath($zip);
        $sheetXml = $zip->getFromName($worksheetPath);

        if ($sheetXml === false) {
            $zip->close();

            throw new RuntimeException('Không tìm thấy sheet dữ liệu trong file .xlsx.');
        }

        $xml = simplexml_load_string($sheetXml);

        if (! $xml instanceof SimpleXMLElement) {
            $zip->close();

            throw new RuntimeException('Nội dung sheet không hợp lệ.');
        }

        $sheetRows = $xml->xpath('//*[local-name()="sheetData"]/*[local-name()="row"]') ?: [];

        if ($sheetRows === []) {
            $zip->close();

            throw new RuntimeException('Sheet đầu tiên không có dữ liệu.');
        }

        $rows = [];

        foreach ($sheetRows as $row) {
            $currentRow = [];
            $cells = $row->xpath('./*[local-name()="c"]') ?: [];

            foreach ($cells as $cell) {
                $reference = (string) ($cell['r'] ?? '');
                $columnIndex = $this->columnReferenceToIndex($reference);

                if ($columnIndex === null) {
                    continue;
                }

                $currentRow[$columnIndex] = $this->readCellValue($cell, $sharedStrings);
            }

            if ($currentRow === []) {
                continue;
            }

            ksort($currentRow);
            $maxColumnIndex = max(array_keys($currentRow));
            $rows[] = array_replace(array_fill(0, $maxColumnIndex + 1, null), $currentRow);
        }

        $zip->close();

        return $this->mapRowsToAssociative($rows);
    }

    /**
     * @param array<int, array<int, string|null>> $rows
     * @return array<int, array<string, string|null>>
     */
    private function mapRowsToAssociative(array $rows): array
    {
        if ($rows === []) {
            throw new RuntimeException('File import không có dữ liệu.');
        }

        $headerRow = array_shift($rows);
        $headers = array_map(fn ($header) => $this->normalizeHeader($header), $headerRow ?? []);

        if ($headers === [] || count(array_filter($headers)) === 0) {
            throw new RuntimeException('Không tìm thấy hàng tiêu đề trong file import.');
        }

        $mappedRows = [];

        foreach ($rows as $row) {
            $associativeRow = [];
            $hasValue = false;

            foreach ($headers as $index => $header) {
                if (! $header) {
                    continue;
                }

                $value = $row[$index] ?? null;
                $normalizedValue = is_string($value) ? trim($value) : $value;
                $associativeRow[$header] = $normalizedValue === '' ? null : $normalizedValue;
                $hasValue = $hasValue || $associativeRow[$header] !== null;
            }

            if ($hasValue) {
                $mappedRows[] = $associativeRow;
            }
        }

        if ($mappedRows === []) {
            throw new RuntimeException('File import không có dòng dữ liệu hợp lệ.');
        }

        return $mappedRows;
    }

    private function normalizeHeader(mixed $header): ?string
    {
        if (! is_string($header)) {
            return null;
        }

        $value = trim(str_replace("\xEF\xBB\xBF", '', $header));

        if ($value === '') {
            return null;
        }

        return (string) Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_');
    }

    /**
     * @return array<int, string>
     */
    private function readSharedStrings(ZipArchive $zip): array
    {
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');

        if ($sharedStringsXml === false) {
            return [];
        }

        $xml = simplexml_load_string($sharedStringsXml);

        if (! $xml instanceof SimpleXMLElement) {
            return [];
        }

        $strings = [];

        $items = $xml->xpath('//*[local-name()="si"]') ?: [];

        foreach ($items as $item) {
            $textNodes = $item->xpath('./*[local-name()="t"]') ?: [];

            if ($textNodes !== []) {
                $strings[] = trim((string) $textNodes[0]);

                continue;
            }

            $text = '';
            foreach ($item->xpath('.//*[local-name()="t"]') ?: [] as $textNode) {
                $text .= (string) $textNode;
            }

            $strings[] = trim($text);
        }

        return $strings;
    }

    private function resolveFirstWorksheetPath(ZipArchive $zip): string
    {
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        $relationshipsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbookXml === false || $relationshipsXml === false) {
            return 'xl/worksheets/sheet1.xml';
        }

        $workbook = simplexml_load_string($workbookXml);
        $relationships = simplexml_load_string($relationshipsXml);

        if (! $workbook instanceof SimpleXMLElement || ! $relationships instanceof SimpleXMLElement) {
            return 'xl/worksheets/sheet1.xml';
        }

        $namespaces = $workbook->getNamespaces(true);
        $relationshipNamespace = $namespaces['r'] ?? null;
        $sheetNodes = $workbook->xpath('//*[local-name()="sheets"]/*[local-name()="sheet"]') ?: [];
        $firstSheet = $sheetNodes[0] ?? null;

        if (! $firstSheet || ! $relationshipNamespace) {
            return 'xl/worksheets/sheet1.xml';
        }

        $attributes = $firstSheet->attributes($relationshipNamespace);
        $relationshipId = (string) ($attributes['id'] ?? '');

        if ($relationshipId === '') {
            return 'xl/worksheets/sheet1.xml';
        }

        foreach ($relationships->Relationship as $relationship) {
            if ((string) ($relationship['Id'] ?? '') !== $relationshipId) {
                continue;
            }

            $target = (string) ($relationship['Target'] ?? '');

            if ($target === '') {
                break;
            }

            return Str::startsWith($target, 'xl/')
                ? $target
                : 'xl/'.ltrim($target, '/');
        }

        return 'xl/worksheets/sheet1.xml';
    }

    /**
     * @param array<int, string> $sharedStrings
     */
    private function readCellValue(SimpleXMLElement $cell, array $sharedStrings): ?string
    {
        $type = (string) ($cell['t'] ?? '');

        if ($type === 'inlineStr') {
            $textNodes = $cell->xpath('.//*[local-name()="t"]') ?: [];
            $value = $textNodes !== [] ? (string) $textNodes[0] : '';

            return $value === '' ? null : trim($value);
        }

        $rawValue = (string) ($cell->v ?? '');

        if ($rawValue === '') {
            return null;
        }

        if ($type === 's') {
            $index = (int) $rawValue;

            return $sharedStrings[$index] ?? null;
        }

        return trim($rawValue);
    }

    private function columnReferenceToIndex(string $reference): ?int
    {
        if (! preg_match('/^[A-Z]+/i', $reference, $matches)) {
            return null;
        }

        $letters = strtoupper($matches[0]);
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
    }
}
