<?php

namespace App\Http\Requests\Api\V1\ProjectHub;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProjectColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'color'     => ['nullable', 'string', 'max:20'],
            'wip_limit' => ['nullable', 'integer', 'min:1', 'max:999'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'Vui lòng nhập tên cột.',
            'name.max'        => 'Tên cột không được vượt quá 255 ký tự.',
            'wip_limit.min'   => 'Giới hạn công việc phải lớn hơn 0.',
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
