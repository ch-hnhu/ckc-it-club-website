<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationAnswerFactory> */
    use HasFactory;

    public function question()
    {
        return $this->belongsTo(ApplicationQuestion::class);
    }

    public function application()
    {
        return $this->belongsTo(ClubApplication::class);
    }
}
