<?php

namespace App\Http\Requests\Api\V1\ClubInformation;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreClubInformationValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'value'     => 'required|string|max:1000',
            'link'      => 'nullable|string|max:1000',
            'alt'       => 'nullable|string|max:255',
            'position'  => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'value.required'    => 'Vui lòng nhập giá trị.',
            'value.max'         => 'Giá trị không được vượt quá 1000 ký tự.',
            'link.max'          => 'Link không được vượt quá 1000 ký tự.',
            'alt.max'           => 'Alt text không được vượt quá 255 ký tự.',
            'position.integer'  => 'Vị trí phải là số nguyên.',
            'position.min'      => 'Vị trí không được âm.',
            'is_active.boolean' => 'Trạng thái không hợp lệ.',
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
