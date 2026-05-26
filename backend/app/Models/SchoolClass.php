<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
	/** @use HasFactory<\Database\Factories\SchoolClassFactory> */
	use HasFactory;
	use SoftDeletes;

	protected $fillable = [
		'value',
		'label',
		'slug',
		'major_id',
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

	public function major(): BelongsTo
	{
		return $this->belongsTo(Major::class, 'major_id');
	}
}
