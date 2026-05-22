<?php

namespace App\Http\Requests\Api\V1\ClubInformation;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateClubInformationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeClubInformation = $this->route('club_information') ?? $this->route('clubInformation');
        $clubInformationId = is_object($routeClubInformation)
            ? $routeClubInformation->id
            : $routeClubInformation;

        return [
            'slug'        => [
                'required',
                'string',
                'max:255',
                Rule::unique('club_informations', 'slug')->ignore($clubInformationId),
            ],
            'description' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'slug.required'     => 'Vui lòng nhập slug.',
            'slug.unique'       => 'Slug này đã được sử dụng.',
            'slug.max'          => 'Slug không được vượt quá 255 ký tự.',
            'description.max'   => 'Mô tả không được vượt quá 1000 ký tự.',
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
