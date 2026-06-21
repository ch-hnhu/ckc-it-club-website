<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_id',
        'question_type_id',
        'content',
        'image',
        'order',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
