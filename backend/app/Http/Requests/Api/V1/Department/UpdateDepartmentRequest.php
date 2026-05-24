<?php

namespace App\Http\Requests\Api\V1\Department;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeDepartment = $this->route('department');
        $departmentId = is_object($routeDepartment) ? $routeDepartment->id : $routeDepartment;

        return [
            'name'         => "required|string|max:255|unique:departments,name,{$departmentId}",
            'description'  => 'nullable|string|max:1000',
            'is_active'    => 'sometimes|boolean',
            'head_role_id' => 'nullable|integer|exists:roles,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'Vui lòng nhập tên ban.',
            'name.unique'         => 'Tên ban đã tồn tại.',
            'description.max'     => 'Mô tả không được vượt quá 1000 ký tự.',
            'head_role_id.exists' => 'Vai trò trưởng ban không tồn tại.',
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
