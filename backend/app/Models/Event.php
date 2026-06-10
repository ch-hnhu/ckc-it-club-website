<?php

namespace App\Models;

use App\Enums\EventStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'created_by', 'department_id', 'title', 'slug',
        'description', 'content', 'thumbnail',
        'start_at', 'end_at', 'location',
        'max_attendees', 'is_registration_required', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'is_registration_required' => 'boolean',
            'status' => EventStatus::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(EventCheckIn::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(EventFeedback::class);
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(EventGalleryItem::class)->orderBy('display_order');
    }

    public static function generateUniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 1;
        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public function getAttendeeCount(): int
    {
        return $this->registrations()->where('status', 'attended')->count();
    }

    public function isFull(): bool
    {
        if (! $this->max_attendees) {
            return false;
        }

        return $this->registrations()->where('status', 'registered')->count() >= $this->max_attendees;
    }
}
