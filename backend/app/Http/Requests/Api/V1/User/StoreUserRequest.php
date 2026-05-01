<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
        // Có thể check permission ở đây:
        // return auth()->user()->can('create', User::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'gender' => 'nullable|string',
            'student_code' => 'nullable|string|max:255|unique:users,student_code',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'faculty_id' => 'nullable|exists:faculties,id',
            'major_id' => 'nullable|exists:majors,id',
            'class_id' => 'nullable|exists:school_classes,id',
            'roles' => 'required|array|min:1',
            'roles.*' => 'string|exists:roles,name,guard_name,web',
            'avatar' => 'nullable|image|mimes:png,jpg,webp|max:2048',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required' => 'Vui lòng nhập họ và tên.',
            'student_code.unique' => 'Mã sinh viên đã tồn tại.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
            'faculty_id.exists' => 'Khoa không tồn tại.',
            'major_id.exists' => 'Ngành không tồn tại.',
            'class_id.exists' => 'Lớp không tồn tại.',
            'roles.required' => 'Vui lòng chọn vai trò.',
            'roles.array' => 'Vai trò không hợp lệ.',
            'roles.min' => 'Vui lòng chọn ít nhất 1 vai trò.',
            'roles.*.exists' => 'Vai trò không tồn tại.',
            'avatar.image' => 'Ảnh đại diện phải là một file hình ảnh.',
            'avatar.mimes' => 'Ảnh đại diện phải có định dạng png, jpg hoặc webp.',
            'avatar.max' => 'Ảnh đại diện không được lớn hơn 2MB.',
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
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
