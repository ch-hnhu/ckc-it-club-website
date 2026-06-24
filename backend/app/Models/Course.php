<?php

namespace App\Models;

use App\Enums\CourseLevel;
use App\Enums\CourseStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'thumbnail',
        'level',
        'status',
        'enrollment_start',
        'enrollment_deadline',
        'course_end',
        'max_offline_slots',
        'max_absent_allowed',
        'quiz_pass_threshold',
        'certificate_template_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'level' => CourseLevel::class,
            'status' => CourseStatus::class,
            'enrollment_start' => 'datetime',
            'enrollment_deadline' => 'datetime',
            'course_end' => 'datetime',
            'max_offline_slots' => 'integer',
            'max_absent_allowed' => 'integer',
            'quiz_pass_threshold' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function certificateTemplate(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'course_tags');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(CourseCertificate::class);
    }

    public function followers(): HasMany
    {
        return $this->hasMany(CourseFollower::class);
    }

    /**
     * User hiện tại có đang "quan tâm" khoá học không.
     */
    public function isFollowedBy(?int $userId): bool
    {
        if (! $userId) {
            return false;
        }

        return $this->followers()->where('user_id', $userId)->exists();
    }

    /**
     * Bản ghi ghi danh của một user trong khoá học (nếu có).
     */
    public function enrollmentFor(?int $userId): ?CourseEnrollment
    {
        if (! $userId) {
            return null;
        }

        return $this->enrollments()->where('user_id', $userId)->first();
    }
}
