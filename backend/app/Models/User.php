<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
	/** @use HasFactory<\Database\Factories\UserFactory> */
	use HasFactory, HasRoles;

	protected string $guard_name = 'web';

	public function faculty()
	{
		return $this->belongsTo(Faculty::class, 'faculties');
	}

	public function major()
	{
		return $this->belongsTo(Major::class, 'majors');
	}

	public function class()
	{
		return $this->belongsTo(SchoolClass::class, 'school_classes');
	}
}
