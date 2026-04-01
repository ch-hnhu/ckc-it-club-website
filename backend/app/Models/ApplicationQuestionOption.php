<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationQuestionOption extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationQuestionOptionFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'value',
        'label',
        'created_at',
        'created_by',
        'updated_at',
        'updated_by',
    ];

    public function question()
    {
        return $this->belongsTo(ApplicationQuestion::class, 'question_id');
    }
}
