<?php

namespace App\Models;

use App\Enums\BoardMemberRole;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class BoardMember extends Pivot
{
    protected $table = 'board_members';

    public $incrementing = true;

    protected $fillable = [
        'board_id',
        'user_id',
        'role',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => BoardMemberRole::class,
            'joined_at' => 'datetime',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
