<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationQuestion extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationQuestionFactory> */
    use HasFactory;

    public $timestamps = false;

    public function options()
    {
        return $this->hasMany(ApplicationQuestionOption::class, 'question_id');
    }
}
