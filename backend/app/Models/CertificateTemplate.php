<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'design',
        'html_content',
        'thumbnail',
        'is_default',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'design' => 'array',
            'is_default' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Thay các placeholder dạng {{key}} trong html_content bằng giá trị tương ứng.
     * Placeholder hỗ trợ: {{name}}, {{course}}, {{cert_code}}, {{issued_at}}.
     *
     * @param  array<string,string>  $placeholders
     */
    public function render(array $placeholders): string
    {
        $search = array_map(fn (string $key) => '{{'.$key.'}}', array_keys($placeholders));

        return str_replace($search, array_values($placeholders), $this->html_content);
    }
}
