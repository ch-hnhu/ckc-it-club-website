<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionType extends Model
{
    protected $fillable = [
        'key',
        'label',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }
}
