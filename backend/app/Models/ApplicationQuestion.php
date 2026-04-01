<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationQuestion extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationQuestionFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'label',
        'type',
        'is_required',
        'order_index',
        'is_active',
        'created_at',
        'created_by',
        'updated_at',
        'updated_by',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'order_index' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function options()
    {
        return $this->hasMany(ApplicationQuestionOption::class, 'question_id');
    }

    public function answers()
    {
        return $this->hasMany(ApplicationAnswer::class, 'question_id');
    }
}
