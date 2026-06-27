<?php

namespace App\Http\Requests\Api\V1\ProjectHub;

use App\Enums\TaskPriority;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateProjectTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'         => ['sometimes', 'required', 'string', 'max:255'],
            'description'   => ['nullable', 'string', 'max:50000'],
            'priority'      => ['nullable', Rule::in(TaskPriority::values())],
            'start_date'    => ['nullable', 'date'],
            'due_date'      => ['nullable', 'date', 'after_or_equal:start_date'],
            'completed'     => ['sometimes', 'boolean'],
            'assignee_ids'   => ['sometimes', 'nullable', 'array'],
            'assignee_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'        => 'Vui lòng nhập tiêu đề công việc.',
            'title.max'             => 'Tiêu đề không được vượt quá 255 ký tự.',
            'priority.in'           => 'Mức độ ưu tiên không hợp lệ.',
            'due_date.after_or_equal' => 'Hạn chót phải sau hoặc bằng ngày bắt đầu.',
            'assignee_ids.*.exists' => 'Người được giao không tồn tại.',
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
