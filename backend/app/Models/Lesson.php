<?php

namespace App\Models;

use App\Enums\CourseStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lesson extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'description',
        'order',
        'status',
        'session_start',
        'session_end',
        'resource_url',
        'resource_label',
        'video_url',
        'video_duration',
        'live_url',
        'document',
        'assignment_url',
        'assignment_deadline',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => CourseStatus::class,
            'order' => 'integer',
            'video_duration' => 'integer',
            'session_start' => 'datetime',
            'session_end' => 'datetime',
            'assignment_deadline' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(LessonAttendance::class);
    }

    public function qrTickets(): HasMany
    {
        return $this->hasMany(LessonQrTicket::class);
    }

    /**
     * URL video phát cho người học: ưu tiên bản chính thức, fallback bản live YouTube.
     */
    public function playableVideoUrl(): ?string
    {
        return $this->video_url ?: $this->live_url;
    }

    /**
     * Số phần nội dung có mặt trong buổi học (video, tài nguyên, bài tập, quiz).
     */
    public function itemsCount(): int
    {
        $hasQuiz = $this->relationLoaded('quiz')
            ? (bool) $this->quiz
            : $this->quiz()->exists();

        return (int) (bool) $this->playableVideoUrl()
            + (int) (bool) $this->resource_url
            + (int) (bool) $this->assignment_url
            + (int) $hasQuiz;
    }
}
