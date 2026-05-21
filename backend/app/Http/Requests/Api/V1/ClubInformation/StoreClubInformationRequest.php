<?php

namespace App\Http\Requests\Api\V1\ClubInformation;

use App\Enums\ClubInformationType;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreClubInformationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label'       => 'required|string|max:255',
            'value'       => 'required|string|max:255',
            'slug'        => 'required|string|max:255|unique:club_informations,slug',
            'type'        => ['required', Rule::in(ClubInformationType::values())],
            'description' => 'nullable|string|max:1000',
            'is_active'   => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'label.required'   => 'Vui lòng nhập tên cấu hình.',
            'label.max'        => 'Tên cấu hình không được vượt quá 255 ký tự.',
            'value.required'   => 'Vui lòng nhập giá trị key.',
            'value.max'        => 'Giá trị key không được vượt quá 255 ký tự.',
            'slug.required'    => 'Vui lòng nhập slug.',
            'slug.unique'      => 'Slug này đã được sử dụng.',
            'slug.max'         => 'Slug không được vượt quá 255 ký tự.',
            'type.required'    => 'Vui lòng chọn kiểu dữ liệu.',
            'type.in'          => 'Kiểu dữ liệu không hợp lệ.',
            'description.max'  => 'Mô tả không được vượt quá 1000 ký tự.',
            'is_active.boolean' => 'Trạng thái không hợp lệ.',
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
