<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Major extends Model
{
	/** @use HasFactory<\Database\Factories\MajorFactory> */
	use HasFactory;

	protected $fillable = [
		'value',
		'label',
		'slug',
		'faculty_id',
	];

	public function faculty(): BelongsTo
	{
		return $this->belongsTo(Faculty::class, 'faculty_id');
	}

	public function schoolClasses(): HasMany
	{
		return $this->hasMany(SchoolClass::class, 'major_id');
	}
}
