<?php

namespace App\Http\Requests\Api\V1\Role;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeRole = $this->route('role');
        $roleId = is_object($routeRole) ? $routeRole->id : $routeRole;

        return [
            'label' => "required|string|unique:roles,label,{$roleId}",
            'name' => "required|string|unique:roles,name,{$roleId}",
            'is_system' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Vui lòng nhập tên vai trò.',
            'label.unique' => 'Tên vai trò đã tồn tại.',
            'name.required' => 'Vui lòng nhập giá trị.',
            'name.unique' => 'Giá trị đã tồn tại.',
            'is_system.required' => 'Vui lòng chọn loại vai trò.',
            'is_system.boolean' => 'Loại vai trò không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator)
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
