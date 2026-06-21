<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseCertificate extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'template_id',
        'track',
        'cert_code',
        'cert_url',
        'has_physical',
        'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'has_physical' => 'boolean',
            'issued_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
