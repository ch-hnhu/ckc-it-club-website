<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EventRegistration extends Model
{
    protected $fillable = [
        'event_id', 'user_id', 'qr_token',
        'status', 'registered_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function checkIn(): HasOne
    {
        return $this->hasOne(EventCheckIn::class, 'registration_id');
    }

    public static function generateQrToken(int $eventId, int $userId): string
    {
        $payload = "{$eventId}:{$userId}:".now()->timestamp;

        return hash_hmac('sha256', $payload, config('app.key'));
    }
}
