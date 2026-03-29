<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

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

	protected string $guard_name = 'web';

	protected $fillable = [
		'full_name',
		'email',
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
}
