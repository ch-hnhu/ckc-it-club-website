<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailTemplateType extends Model
{
    protected $table = 'mail_template_types';

    protected $fillable = [
        'slug',
        'label',
        'description',
        'created_by',
        'updated_by',
    ];

    public function mailTemplates()
    {
        return $this->hasMany(MailTemplate::class, 'mail_template_type_id');
    }
}
