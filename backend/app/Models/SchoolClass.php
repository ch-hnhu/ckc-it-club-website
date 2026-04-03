<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
	/** @use HasFactory<\Database\Factories\SchoolClassFactory> */
	use HasFactory;

	protected $fillable = [
		'value',
		'label',
		'slug',
		'major_id',
	];

	public function major(): BelongsTo
	{
		return $this->belongsTo(Major::class, 'major_id');
	}
}
