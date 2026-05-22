<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubInformation extends Model
{
    /** @use HasFactory<\Database\Factories\ClubInformationFactory> */
    use HasFactory;

    protected $table = 'club_informations';

    protected $fillable = [
        'value',
        'label',
        'slug',
        'type',
        'description',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime:d/m/Y',
            'updated_at' => 'datetime:d/m/Y',
        ];
    }

    public function clubInformationValues()
    {
        return $this->hasMany(ClubInformationValue::class, 'club_information_id');
    }
}
