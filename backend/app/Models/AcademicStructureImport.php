<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicStructureImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_file_name',
        'stored_file_path',
        'storage_disk',
        'file_type',
        'file_size_bytes',
        'file_hash',
        'uploaded_by',
        'status',
        'processed_rows',
        'created_faculties',
        'created_majors',
        'created_school_classes',
        'existing_faculties',
        'existing_majors',
        'existing_school_classes',
        'errors_count',
        'error_message',
        'error_details',
    ];

    protected function casts(): array
    {
        return [
            'file_size_bytes' => 'integer',
            'processed_rows' => 'integer',
            'created_faculties' => 'integer',
            'created_majors' => 'integer',
            'created_school_classes' => 'integer',
            'existing_faculties' => 'integer',
            'existing_majors' => 'integer',
            'existing_school_classes' => 'integer',
            'errors_count' => 'integer',
            'error_details' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
