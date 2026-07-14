<?php

namespace App\Http\Requests\Api\V1\Contact;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => is_string($this->input('status')) ? trim($this->input('status')) : $this->input('status'),
            'status_note' => is_string($this->input('status_note')) ? trim($this->input('status_note')) : $this->input('status_note'),
        ]);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['pending', 'processing', 'done'])],
            'status_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
