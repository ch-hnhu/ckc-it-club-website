<?php

namespace App\Http\Requests\Api\V1\Department;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateDepartmentUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_head' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'is_head.required' => 'Vui lòng chọn chức vụ trong ban.',
            'is_head.boolean' => 'Chức vụ trong ban không hợp lệ.',
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
