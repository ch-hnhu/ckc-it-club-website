<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PointRule extends Model
{
    protected $fillable = [
        'key', 'name', 'description', 'points',
        'max_per_day', 'max_per_week', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'max_per_day' => 'integer',
            'max_per_week' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
