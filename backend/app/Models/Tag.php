<?php

namespace App\Models;

use App\Enums\TagModelType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tag extends Model
{
    use SoftDeletes;

    protected $fillable = ['model_type', 'name', 'slug', 'description', 'created_by', 'updated_by', 'deleted_by'];

    public function blogs(): BelongsToMany
    {
        return $this->belongsToMany(Blog::class, 'blog_tags');
    }

    public function scopeOfType(Builder $query, TagModelType|string $modelType): Builder
    {
        $value = $modelType instanceof TagModelType ? $modelType->value : $modelType;

        return $query->where('model_type', $value);
    }
}
