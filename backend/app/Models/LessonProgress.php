<?php

namespace App\Models;

use App\Enums\LessonSectionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'section_type',
        'is_completed',
        'score',
        'watch_percentage',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'section_type' => LessonSectionType::class,
            'is_completed' => 'boolean',
            'score' => 'decimal:2',
            'watch_percentage' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
