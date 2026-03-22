<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculties');
    }

    public function major()
    {
        return $this->belongsTo(Major::class, 'majors');
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'school_classes');
    }
}
