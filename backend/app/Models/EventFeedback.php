<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventFeedback extends Model
{
    protected $table = 'event_feedbacks';

    protected $fillable = ['event_id', 'user_id', 'rating', 'comment', 'is_hidden', 'moderation_reason', 'moderated_at'];

    protected function casts(): array
    {
        return [
            'is_hidden'    => 'boolean',
            'moderated_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
