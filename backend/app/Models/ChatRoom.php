<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatRoom extends Model
{
    protected $table = 'chat_rooms';

    protected $fillable = ['type', 'name', 'last_message_at'];

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
