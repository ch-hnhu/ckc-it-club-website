<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $table = 'messages';

    protected $fillable = [
        'room_id',
        'content',
        'type',
        'event_type',
        'reply_to_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class, 'room_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }
}
