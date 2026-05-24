<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;
use App\Enums\RolesEnum;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $full_name
 * @property string|null $gender
 * @property string $email
 * @property string|null $avatar
 * @property string|null $provider
 * @property string|null $provider_id
 * @property \Carbon\Carbon|null $email_verified_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    // Spatie uses this to pick the guard when assigning/ checking roles
    protected string $guard_name = 'web';

    protected $fillable = [
        'full_name',
        'email',
        'email_verified_at',
        'password',
        'student_code',
        'gender',
        'is_active',
        'faculty_id',
        'major_id',
        'class_id',
        'provider',
        'provider_id',
        'avatar',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime:d/m/Y',
            'updated_at' => 'datetime:d/m/Y',
        ];
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id');
    }

    public function major()
    {
        return $this->belongsTo(Major::class, 'major_id');
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_user')
            ->using(UserDepartment::class)
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    /**
     * Kiểm tra user có phải trưởng ban của một department hay không.
     *
     * Điều kiện: user thuộc department VÀ có role trùng với department.head_role_id.
     */
    public function isHeadOf(Department $department): bool
    {
        if (! $department->head_role_id) {
            return false;
        }

        return $this->departments()->where('departments.id', $department->id)->exists()
            && $this->roles()->where('roles.id', $department->head_role_id)->exists();
    }

    /**
     * Convert local avatar path to public URL while keeping external URLs unchanged.
     */
    public function getAvatarAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }

    /**
     * Ensure every newly created user has the default role.
     * This is a safety net in case other flows skip manual assignment.
     */
    protected static function booted(): void
    {
        static::created(function (self $user) {
            // guard against failures; we don't want to block user creation
            try {
                $role = Role::findOrCreate(RolesEnum::USER->value, 'web');
                if (! $user->hasRole($role->name)) {
                    $user->assignRole($role);
                }
            } catch (\Throwable $e) {
                \Log::error('Auto-assign default role failed: '.$e->getMessage());
            }
        });
    }
}
