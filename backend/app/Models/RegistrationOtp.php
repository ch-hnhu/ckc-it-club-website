<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistrationOtp extends Model
{
    protected $fillable = [
        'email',
        'otp',
        'registration_data',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at'        => 'datetime',
        'used_at'           => 'datetime',
        'registration_data' => 'array',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }
}
