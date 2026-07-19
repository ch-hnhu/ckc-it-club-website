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
        'created_by', 'department_id', 'organizer_id', 'title', 'slug',
        'description', 'content', 'thumbnail', 'feedback_form_url',
        'start_at', 'end_at', 'location',
        'registration_start_at', 'registration_end_at',
        'max_attendees', 'is_members_only', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'registration_start_at' => 'datetime',
            'registration_end_at' => 'datetime',
            'is_members_only' => 'boolean',
            'status' => EventStatus::class,
        ];
    }

    /**
     * URL đầy đủ của ảnh thumbnail.
     * Sau migration, DB lưu URL tuyệt đối (Supabase hoặc external).
     */
    public function thumbnailUrl(): ?string
    {
        if (! $this->thumbnail) {
            return null;
        }

        // Bản ghi cũ còn lưu đường dẫn tương đối trên disk public (vd. event-thumbnails/x.jpg)
        return Str::startsWith($this->thumbnail, ['http://', 'https://'])
            ? $this->thumbnail
            : asset('storage/' . $this->thumbnail);
    }

    /**
     * Sự kiện có đang trong khoảng thời gian mở đăng ký không.
     * Null = không giới hạn ở phía đó.
     */
    public function isRegistrationOpen(): bool
    {
        if ($this->registration_start_at && now()->lt($this->registration_start_at)) {
            return false;
        }

        if ($this->registration_end_at && now()->gt($this->registration_end_at)) {
            return false;
        }

        return true;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
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

    /**
     * Các board ProjectHub liên kết với sự kiện này.
     */
    public function boards(): HasMany
    {
        return $this->hasMany(Board::class);
    }

    /**
     * Tự động chuyển trạng thái theo thời gian thực tế (chỉ tiến, không lùi):
     * published → ongoing khi đã đến giờ bắt đầu, published/ongoing → ended khi đã qua giờ kết thúc.
     * Không đụng đến draft, cancelled hay sự kiện đã được kết thúc thủ công.
     */
    public static function syncStatuses(): void
    {
        static::query()
            ->where('status', 'published')
            ->where('start_at', '<=', now())
            ->where('end_at', '>', now())
            ->update(['status' => 'ongoing']);

        static::query()
            ->whereIn('status', ['published', 'ongoing'])
            ->where('end_at', '<=', now())
            ->update(['status' => 'ended']);
    }

    public function syncStatusFromSchedule(): void
    {
        if (in_array($this->status->value, ['draft', 'cancelled'], true)) {
            return;
        }

        $now = now();
        $nextStatus = EventStatus::PUBLISHED;

        if ($this->end_at && $this->end_at->lte($now)) {
            $nextStatus = EventStatus::ENDED;
        } elseif ($this->start_at && $this->start_at->lte($now)) {
            $nextStatus = EventStatus::ONGOING;
        }

        if ($this->status !== $nextStatus) {
            $this->forceFill(['status' => $nextStatus])->save();
        }
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
