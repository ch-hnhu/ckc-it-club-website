<?php

namespace App\Http\Requests\Api\V1\Major;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateMajorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeMajor = $this->route('major');
        $majorId = is_object($routeMajor) ? $routeMajor->id : $routeMajor;

        return [
            'faculty_id' => ['required', 'integer', 'exists:faculties,id'],
            'label' => [
                'required',
                'string',
                'max:255',
                Rule::unique('majors', 'label')
                    ->ignore($majorId)
                    ->where(fn ($query) => $query->where('faculty_id', $this->integer('faculty_id'))),
            ],
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('majors', 'value')
                    ->ignore($majorId)
                    ->where(fn ($query) => $query->where('faculty_id', $this->integer('faculty_id'))),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'faculty_id.required' => 'Vui lòng chọn khoa.',
            'faculty_id.exists' => 'Khoa không tồn tại.',
            'label.required' => 'Vui lòng nhập tên ngành.',
            'label.unique' => 'Tên ngành đã tồn tại trong khoa này.',
            'value.required' => 'Vui lòng nhập mã ngành.',
            'value.unique' => 'Mã ngành đã tồn tại trong khoa này.',
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
