<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

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
}
