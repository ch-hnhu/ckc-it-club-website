<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reaction extends Model
{
    /**
     * The table only stores created_at (no updated_at).
     */
    public $timestamps = false;

    protected $fillable = ['user_id', 'target_type', 'target_id', 'type', 'created_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
