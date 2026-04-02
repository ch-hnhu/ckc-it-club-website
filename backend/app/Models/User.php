<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;
use App\Enums\RolesEnum;

/**
 * @property int $id
 * @property string $full_name
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
    use HasApiTokens, HasFactory, HasRoles;

    // Spatie uses this to pick the guard when assigning/ checking roles
    protected string $guard_name = 'web';

    protected $fillable = [
        'full_name',
        'email',
        'email_verified_at',
        'password',
        'student_code',
        'is_active',
        'faculty_id',
        'major_id',
        'class_id',
        'provider',
        'provider_id',
        'avatar',
    ];

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
