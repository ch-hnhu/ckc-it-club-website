<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MailTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'mail_templates';

    protected $fillable = [
        'mail_template_type_id',
        'name',
        'subject',
        'body',
        'is_default',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function type()
    {
        return $this->belongsTo(MailTemplateType::class, 'mail_template_type_id');
    }
}
