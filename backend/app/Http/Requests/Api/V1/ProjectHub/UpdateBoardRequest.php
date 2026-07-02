<?php

namespace App\Http\Requests\Api\V1\ProjectHub;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateBoardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'description'   => ['nullable', 'string', 'max:5000'],
            'color'         => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'course_id'     => ['nullable', 'integer', 'exists:courses,id'],
            'event_id'      => ['nullable', 'integer', 'exists:events,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'Vui lòng nhập tên dự án.',
            'name.max'             => 'Tên dự án không được vượt quá 255 ký tự.',
            'description.max'      => 'Mô tả không được vượt quá 5000 ký tự.',
            'department_id.exists' => 'Ban được chọn không tồn tại.',
            'course_id.exists'     => 'Khoá học được chọn không tồn tại.',
            'event_id.exists'      => 'Sự kiện được chọn không tồn tại.',
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
