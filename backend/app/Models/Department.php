<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'departments';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'head_role_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'created_at' => 'datetime:d/m/Y',
            'updated_at' => 'datetime:d/m/Y',
            'deleted_at' => 'datetime:d/m/Y',
        ];
    }

    /**
     * Role được chỉ định là trưởng ban của department này.
     */
    public function headRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'head_role_id');
    }

    /**
     * Tất cả thành viên thuộc department.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'department_user')
            ->using(UserDepartment::class)
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    /**
     * Trả về user đang giữ vai trò trưởng ban.
     *
     * User là trưởng ban khi: thuộc department VÀ có role trùng head_role_id.
     */
    public function head(): ?User
    {
        if (! $this->head_role_id) {
            return null;
        }

        return $this->members()
            ->whereHas('roles', fn ($q) => $q->where('roles.id', $this->head_role_id))
            ->first();
    }
}
