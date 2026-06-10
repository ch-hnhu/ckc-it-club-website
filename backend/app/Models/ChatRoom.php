<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatRoom extends Model
{
    use SoftDeletes;

    protected $table = 'chat_rooms';

    protected $fillable = ['name', 'image', 'last_message_at', 'deleted_by'];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(ChatMember::class, 'room_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'room_id');
    }
}
