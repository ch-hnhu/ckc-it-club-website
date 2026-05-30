<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'full_name'        => 'nullable|string|max:255',
            'username'         => "nullable|string|max:30|regex:/^[a-z0-9_]+\$/|unique:users,username,{$userId}",
            'bio'              => 'nullable|string|max:500',
            'student_code'     => 'nullable|string|max:15',
            'faculty_id'       => 'nullable|integer|exists:faculties,id',
            'major_id'         => 'nullable|integer|exists:majors,id',
            'class_id'         => 'nullable|integer|exists:school_classes,id',
            'gender'           => 'nullable|string|in:Nam,Nữ,Khác',
            'date_of_birth'    => 'nullable|date|before:today',
            'avatar'           => 'nullable|file|image|max:5120',
            'cover_image'      => 'nullable|file|image|max:5120',
            'skills_sync'      => 'nullable|string',
            'skills'           => 'nullable|array',
            'skills.*'         => 'string|exists:skills,name',
            'social_github'    => 'nullable|string|max:100',
            'social_linkedin'  => 'nullable|string|max:100',
            'social_instagram' => 'nullable|string|max:100',
            'social_youtube'   => 'nullable|string|max:100',
            'social_tiktok'    => 'nullable|string|max:100',
            'social_twitch'    => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex'          => 'Username chỉ được chứa chữ thường, số và dấu gạch dưới.',
            'username.unique'         => 'Username đã được sử dụng.',
            'date_of_birth.before'    => 'Ngày sinh phải trước ngày hôm nay.',
            'avatar.image'            => 'Ảnh đại diện phải là file hình ảnh.',
            'avatar.max'              => 'Ảnh đại diện không được vượt quá 5MB.',
            'cover_image.image'       => 'Ảnh bìa phải là file hình ảnh.',
            'cover_image.max'         => 'Ảnh bìa không được vượt quá 5MB.',
            'faculty_id.exists'       => 'Khoa không hợp lệ.',
            'major_id.exists'         => 'Ngành không hợp lệ.',
            'class_id.exists'         => 'Lớp không hợp lệ.',
            'skills.*.exists'         => 'Một hoặc nhiều kỹ năng không hợp lệ.',
        ];
    }
}
