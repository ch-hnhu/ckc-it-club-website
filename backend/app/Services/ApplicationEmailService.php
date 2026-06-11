<?php

namespace App\Services;

use App\Mail\ApplicationStatusMail;
use App\Models\ClubInformation;
use App\Models\MailTemplateType;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ApplicationEmailService
{
    private static array $statusLabels = [
        'processing' => 'Đang xét duyệt',
        'interview'  => 'Mời phỏng vấn',
        'passed'     => 'Trúng tuyển',
        'failed'     => 'Không trúng tuyển',
    ];

    public static function send(User $applicant, string $newStatus, int $applicationId): void
    {
        if (! static::isEnabled()) {
            return;
        }

        $typeSlug = $newStatus;
        $type = MailTemplateType::where('slug', $typeSlug)
            ->with(['mailTemplates' => fn ($q) => $q->where('is_default', true)->whereNull('deleted_at')])
            ->first();

        if (! $type) {
            Log::warning("ApplicationEmailService: mail template type not found for status '{$newStatus}'");
            return;
        }

        $template = $type->mailTemplates->first();

        if (! $template) {
            Log::warning("ApplicationEmailService: no default template for type '{$newStatus}'");
            return;
        }

        $clubName = static::getClubName();
        $variables = [
            '{{applicant_name}}' => $applicant->full_name ?? 'Bạn',
            '{{club_name}}'      => $clubName,
            '{{status_label}}'   => static::$statusLabels[$newStatus] ?? $newStatus,
        ];

        $subject = str_replace(array_keys($variables), array_values($variables), $template->subject);
        $body    = str_replace(array_keys($variables), array_values($variables), $template->body);

        try {
            Mail::to($applicant->email)->send(new ApplicationStatusMail($subject, $body));
        } catch (\Throwable $e) {
            Log::error("ApplicationEmailService: failed to send email to {$applicant->email} — {$e->getMessage()}");
        }
    }

    private static function isEnabled(): bool
    {
        $info = ClubInformation::where('slug', 'auto-send-mail-recruitment')->first();

        if (! $info) {
            return false;
        }

        $activeValue = $info->clubInformationValues()
            ->where('is_active', true)
            ->value('value');

        return $activeValue === 'true';
    }

    private static function getClubName(): string
    {
        $info = ClubInformation::where('slug', 'club-name')->first();

        if (! $info) {
            return 'CKC IT CLUB';
        }

        return $info->clubInformationValues()
            ->where('is_active', true)
            ->value('value') ?? 'CKC IT CLUB';
    }
}
