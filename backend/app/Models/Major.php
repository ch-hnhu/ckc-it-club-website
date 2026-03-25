<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Major extends Model
{
	/** @use HasFactory<\Database\Factories\MajorFactory> */
	use HasFactory;

	protected $fillable = [
		'name',
		'slug',
		'faculty_id',
	];
}
