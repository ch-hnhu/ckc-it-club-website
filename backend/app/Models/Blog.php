<?php

namespace App\Models;

use App\Enums\RolesEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Blog extends Model
{
    protected $fillable = [
        'author_id', 'title', 'slug', 'content', 'excerpt',
        'cover_image', 'status', 'visibility', 'published_at', 'view_count',
        'is_pinned', 'pinned_at', 'is_highlight',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_pinned'      => 'boolean',
            'pinned_at'      => 'datetime',
            'is_highlight'   => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'blog_tags');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        return $query->where(function (Builder $visibility) use ($viewer) {
            $visibility->where('visibility', 'public');

            if (! $viewer) {
                return;
            }

            $visibility->orWhere('author_id', $viewer->id);

            if ($this->isClubMember($viewer)) {
                $visibility->orWhere('visibility', 'members');
            }
        });
    }

    public function isVisibleTo(?User $viewer): bool
    {
        return match ($this->visibility ?? 'public') {
            'public'  => true,
            'private' => $viewer !== null && (int) $this->author_id === (int) $viewer->id,
            'members' => $viewer !== null
                && ((int) $this->author_id === (int) $viewer->id || $this->isClubMember($viewer)),
            default   => false,
        };
    }

    private function isClubMember(User $viewer): bool
    {
        return $viewer->hasRole([RolesEnum::CLUB_MEMBER->value, 'club_member']);
    }
}
