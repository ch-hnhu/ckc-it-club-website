<?php

namespace App\Http\Requests\Api\V1\Faculty;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeFaculty = $this->route('faculty');
        $facultyId = is_object($routeFaculty) ? $routeFaculty->id : $routeFaculty;

        return [
            'label' => "required|string|max:255|unique:faculties,label,{$facultyId}",
            'value' => "required|string|max:255|unique:faculties,value,{$facultyId}",
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Vui lòng nhập tên khoa.',
            'label.unique' => 'Tên khoa đã tồn tại.',
            'value.required' => 'Vui lòng nhập mã khoa.',
            'value.unique' => 'Mã khoa đã tồn tại.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
