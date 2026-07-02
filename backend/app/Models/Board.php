<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Board extends Model
{
    use SoftDeletes;

    protected $table = 'kanban_boards';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'department_id',
        'course_id',
        'event_id',
        'is_archived',
        'archived_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(BoardColumn::class)->orderBy('position');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(BoardTask::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(BoardMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'board_members')
            ->using(BoardMember::class)
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * User có quyền truy cập board hay không (là người tạo hoặc thành viên).
     */
    public function hasMember(?int $userId): bool
    {
        if (! $userId) {
            return false;
        }

        return $this->created_by === $userId
            || $this->members()->where('users.id', $userId)->exists();
    }
}
