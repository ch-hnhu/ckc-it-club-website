<?php

namespace App\Http\Requests\Api\V1\SchoolClass;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreSchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'major_id' => ['required', 'integer', 'exists:majors,id'],
            'label' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes', 'label')->where(
                    fn ($query) => $query->where('major_id', $this->integer('major_id')),
                ),
            ],
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes', 'value')->where(
                    fn ($query) => $query->where('major_id', $this->integer('major_id')),
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'major_id.required' => 'Vui lòng chọn ngành.',
            'major_id.exists' => 'Ngành không tồn tại.',
            'label.required' => 'Vui lòng nhập tên lớp.',
            'label.unique' => 'Tên lớp đã tồn tại trong ngành này.',
            'value.required' => 'Vui lòng nhập mã lớp.',
            'value.unique' => 'Mã lớp đã tồn tại trong ngành này.',
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
