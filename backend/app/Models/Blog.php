<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Blog extends Model
{
    protected $fillable = [
        'author_id', 'title', 'slug', 'content', 'excerpt',
        'cover_image', 'status', 'published_at', 'view_count',
        'is_pinned', 'pinned_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_pinned'    => 'boolean',
            'pinned_at'    => 'datetime',
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
}
