<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
	/** @use HasFactory<\Database\Factories\FacultyFactory> */
	use HasFactory;

	protected $fillable = [
		'value',
		'label',
		'slug',
	];

	public function majors(): HasMany
	{
		return $this->hasMany(Major::class, 'faculty_id');
	}
}
