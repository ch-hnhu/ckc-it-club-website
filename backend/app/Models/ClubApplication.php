<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubApplication extends Model
{
    /** @use HasFactory<\Database\Factories\ClubApplicationFactory> */
    use HasFactory;

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function answers()
    {
        return $this->hasMany(ApplicationAnswer::class, 'application_id');
    }
}
