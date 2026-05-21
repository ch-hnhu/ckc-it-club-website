<?php

namespace App\Http\Requests\Api\V1\AcademicStructure;

use Illuminate\Foundation\Http\FormRequest;

class ImportAcademicStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn file để import.',
            'file.file' => 'Tệp tải lên không hợp lệ.',
            'file.max' => 'Dung lượng file không được vượt quá 5MB.',
        ];
    }
}
