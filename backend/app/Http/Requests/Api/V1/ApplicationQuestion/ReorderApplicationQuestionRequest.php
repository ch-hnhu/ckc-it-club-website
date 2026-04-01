<?php

namespace App\Http\Requests\Api\V1\ApplicationQuestion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderApplicationQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_ids' => ['required', 'array', 'min:1'],
            'question_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('application_questions', 'id'),
            ],
        ];
    }
}
