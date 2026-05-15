<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\PermissionRegistrar;

class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
        'label',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function toArray()
    {
        $data = parent::toArray();
        $data['created_at'] = $this->created_at?->format('d/m/Y');
        $data['updated_at'] = $this->updated_at?->format('d/m/Y');
        return $data;
    }

    public function users(): BelongsToMany
    {
        $guard = $this->attributes['guard_name'] ?? config('auth.defaults.guard');

        if (! $guard) {
            $guard = config('auth.defaults.guard');
        }

        $relatedModel = getModelForGuard($guard);

        // Fallback to the default users provider model if helper returned null
        if (! $relatedModel) {
            $relatedModel = config('auth.providers.users.model') ?? null;
        }

        return $this->morphedByMany(
            $relatedModel,
            'model',
            config('permission.table_names.model_has_roles'),
            app(PermissionRegistrar::class)->pivotRole,
            config('permission.column_names.model_morph_key')
        );
    }
}
