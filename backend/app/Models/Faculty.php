<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faculty extends Model
{
	/** @use HasFactory<\Database\Factories\FacultyFactory> */
	use HasFactory;
	use SoftDeletes;

	protected $fillable = [
		'value',
		'label',
		'slug',
		'created_by',
		'updated_by',
		'deleted_by',
	];

	protected function casts(): array
	{
		return [
			'created_at' => 'datetime',
			'updated_at' => 'datetime',
			'deleted_at' => 'datetime',
		];
	}

	public function majors(): HasMany
	{
		return $this->hasMany(Major::class, 'faculty_id');
	}
}
