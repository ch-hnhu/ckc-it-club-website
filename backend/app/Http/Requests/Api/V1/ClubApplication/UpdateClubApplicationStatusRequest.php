<?php

namespace App\Http\Requests\Api\V1\ClubApplication;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClubApplicationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in(['processing', 'interview', 'passed', 'failed']),
            ],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
