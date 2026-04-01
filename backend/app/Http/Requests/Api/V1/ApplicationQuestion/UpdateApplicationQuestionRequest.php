<?php

namespace App\Http\Requests\Api\V1\ApplicationQuestion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_required' => $this->boolean('is_required'),
            'is_active' => $this->boolean('is_active'),
            'options' => $this->input('options', []),
        ]);
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['text', 'textarea', 'radio', 'select'])],
            'is_required' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'options' => ['array'],
            'options.*.id' => ['nullable', 'integer'],
            'options.*.value' => ['nullable', 'string', 'max:255'],
            'options.*.label' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');
            $options = collect($this->input('options', []));

            if (in_array($type, ['radio', 'select'], true)) {
                if ($options->count() < 2) {
                    $validator->errors()->add('options', 'Câu hỏi dạng chọn phải có ít nhất 2 lựa chọn.');
                }

                foreach ($options as $index => $option) {
                    if (blank($option['label'] ?? null)) {
                        $validator->errors()->add("options.$index.label", 'Nhãn lựa chọn không được để trống.');
                    }

                    if (blank($option['value'] ?? null)) {
                        $validator->errors()->add("options.$index.value", 'Giá trị lựa chọn không được để trống.');
                    }
                }

                if (
                    $options->pluck('value')->filter(fn ($value) => !blank($value))->count() !==
                    $options->pluck('value')->filter(fn ($value) => !blank($value))->unique()->count()
                ) {
                    $validator->errors()->add('options', 'Giá trị lựa chọn không được trùng nhau.');
                }

                return;
            }

            if ($options->isNotEmpty()) {
                $validator->errors()->add('options', 'Câu hỏi dạng text hoặc textarea không được có lựa chọn.');
            }
        });
    }
}
