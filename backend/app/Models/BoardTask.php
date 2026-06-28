<?php

namespace App\Models;

use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BoardTask extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'board_id',
        'column_id',
        'title',
        'description',
        'position',
        'priority',
        'start_date',
        'due_date',
        'completed_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'priority' => TaskPriority::class,
            'position' => 'integer',
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'column_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'board_task_assignees', 'task_id', 'user_id')
            ->using(BoardTaskAssignee::class)
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(BoardChecklistItem::class)->orderBy('position');
    }
}
