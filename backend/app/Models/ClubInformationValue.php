<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubInformationValue extends Model
{
    /** @use HasFactory<\Database\Factories\ClubInformationValueFactory> */
    use HasFactory;

    protected $fillable = [
        'club_information_id',
        'value',
        'link',
        'alt',
        'position',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime:d/m/Y',
            'updated_at' => 'datetime:d/m/Y',
        ];
    }
}
