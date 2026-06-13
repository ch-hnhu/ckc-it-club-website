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
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $full_name
 * @property string|null $gender
 * @property string $email
 * @property string|null $username
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
        'username',
        'email_verified_at',
        'password',
        'student_code',
        'gender',
        'date_of_birth',
        'is_active',
        'faculty_id',
        'major_id',
        'class_id',
        'provider',
        'provider_id',
        'avatar',
        'cover_image',
        'bio',
        'social_github',
        'social_linkedin',
        'social_instagram',
        'social_youtube',
        'social_tiktok',
        'social_twitch',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'date_of_birth' => 'date:Y-m-d',
            'created_at' => 'datetime:d/m/Y',
            'updated_at' => 'datetime:d/m/Y',
            'total_points' => 'integer',
        ];
    }

    /**
     * Gamification — rank hiện tại của user.
     * total_points chỉ được ghi qua App\Services\PointService.
     * rank_id được đồng bộ qua PointService và App\Services\RankSyncService
     * (cố ý KHÔNG đưa vào $fillable để chặn controller mass-assign).
     */
    public function rank(): BelongsTo
    {
        return $this->belongsTo(Rank::class);
    }

    public function pointTransactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PointTransaction::class);
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

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'user_skills');
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'follower_id', 'following_id');
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'following_id', 'follower_id');
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
     * Kiểm tra user có phải sinh viên trường Cao Thắng hay không.
     * Email hợp lệ: 10 chữ số + @caothang.edu.vn (ví dụ: 0306231234@caothang.edu.vn)
     */
    public function isSchoolStudent(): bool
    {
        return (bool) preg_match('/^\d{10}@caothang\.edu\.vn$/', $this->email);
    }

    /**
     * Generate a unique username from an email address.
     * Extracts the prefix, sanitizes it, and appends a suffix if already taken.
     */
    public static function generateUniqueUsername(string $email): string
    {
        $base = strtolower(Str::before($email, '@'));
        $base = preg_replace('/[^a-z0-9_]/', '_', $base);
        $base = trim(substr($base, 0, 25), '_');

        $username = $base;
        while (static::where('username', $username)->exists()) {
            $username = $base . '_' . rand(1000, 9999);
        }

        return $username;
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

    public function getCoverImageAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
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
