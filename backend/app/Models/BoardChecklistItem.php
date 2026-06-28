<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoardChecklistItem extends Model
{
    protected $fillable = [
        'board_task_id',
        'content',
        'is_done',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'is_done' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(BoardTask::class);
    }
}
