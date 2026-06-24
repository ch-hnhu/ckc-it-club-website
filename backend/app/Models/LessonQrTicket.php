<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonQrTicket extends Model
{
    protected $fillable = [
        'user_id',
        'lesson_id',
        'token',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'used_at' => 'datetime',
        ];
    }

    /**
     * Sinh token vé QR (khớp cách Events sinh qr_token): HMAC theo app key,
     * duy nhất theo buổi học + học viên + thời điểm cấp.
     */
    public static function generateToken(int $lessonId, int $userId): string
    {
        $payload = "{$lessonId}:{$userId}:".now()->timestamp;

        return hash_hmac('sha256', $payload, config('app.key'));
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
