<?php

namespace App\Models;

use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectTask extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
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

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(ProjectColumn::class, 'column_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_task_assignees', 'task_id', 'user_id')
            ->using(ProjectTaskAssignee::class)
            ->withPivot('assigned_at')
            ->withTimestamps();
    }
}
