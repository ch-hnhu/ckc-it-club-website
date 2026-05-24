<?php

namespace App\Http\Requests\Api\V1\Department;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreDepartmentUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'   => 'required|integer|exists:users,id',
            'joined_at' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Vui lòng chọn thành viên.',
            'user_id.exists'   => 'Thành viên không tồn tại.',
            'joined_at.date'   => 'Ngày tham gia không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
