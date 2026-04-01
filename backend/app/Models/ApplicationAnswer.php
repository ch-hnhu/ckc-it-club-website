<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationAnswerFactory> */
    use HasFactory;

    public $timestamps = false;

    public function question()
    {
        return $this->belongsTo(ApplicationQuestion::class, 'question_id');
    }

    public function application()
    {
        return $this->belongsTo(ClubApplication::class, 'application_id');
    }
}
