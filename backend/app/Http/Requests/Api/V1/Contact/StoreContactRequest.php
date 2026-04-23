<?php

namespace App\Http\Requests\Api\V1\Contact;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'full_name' => is_string($this->input('full_name')) ? trim($this->input('full_name')) : $this->input('full_name'),
            'email' => is_string($this->input('email')) ? trim($this->input('email')) : $this->input('email'),
            'subject' => is_string($this->input('subject')) ? trim($this->input('subject')) : $this->input('subject'),
            'message' => is_string($this->input('message')) ? trim($this->input('message')) : $this->input('message'),
        ]);
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Vui long nhap ho ten.',
            'email.required' => 'Vui long nhap email.',
            'email.email' => 'Email khong hop le.',
            'subject.required' => 'Vui long chon chu de.',
            'message.required' => 'Vui long nhap noi dung.',
        ];
    }
}
