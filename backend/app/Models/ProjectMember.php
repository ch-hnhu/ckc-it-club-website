<?php

namespace App\Models;

use App\Enums\ProjectMemberRole;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ProjectMember extends Pivot
{
    protected $table = 'project_members';

    public $incrementing = true;

    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => ProjectMemberRole::class,
            'joined_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
